// ============================================
// AgriCore — Ticket Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketService } from '../services/ticketService';
import { supabaseAdmin } from '../config/supabaseClient';

vi.mock('../services/notificationService', () => ({
  notificationService: { create: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../services/activityLogService', () => ({
  activityLogService: { log: vi.fn().mockResolvedValue({}) },
}));

const ticketService = new TicketService();

describe('TicketService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('creates a ticket without attachment', async () => {
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // insert ticket
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 't1', user_id: 'u1', title: 'Test Bug',
                description: 'Desc', type: 'bug', urgency: 'high',
                status: 'open',
              },
              error: null,
            }),
          } as any;
        }
        // notifyAdmins – fetch admins
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [{ id: 'admin1' }] }),
        } as any;
      });

      const ticket = await ticketService.create('u1', {
        title: 'Test Bug', description: 'Desc', type: 'bug', urgency: 'high',
      });

      expect(ticket.id).toBe('t1');
      expect(ticket.type).toBe('bug');
    });

    it('rejects invalid file types', async () => {
      const file = {
        mimetype: 'application/exe',
        size: 1000,
        originalname: 'malware.exe',
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      await expect(
        ticketService.create('u1', {
          title: 'Bug', description: 'Desc', type: 'bug', urgency: 'low',
        }, file)
      ).rejects.toThrow('Invalid file type');
    });

    it('rejects files over 10 MB', async () => {
      const file = {
        mimetype: 'image/png',
        size: 11 * 1024 * 1024,
        originalname: 'huge.png',
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      await expect(
        ticketService.create('u1', {
          title: 'Bug', description: 'Desc', type: 'bug', urgency: 'low',
        }, file)
      ).rejects.toThrow('File too large');
    });
  });

  describe('getByUser', () => {
    it('returns tickets for given user', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 't1', title: 'Bug 1', user_id: 'u1' },
            { id: 't2', title: 'Bug 2', user_id: 'u1' },
          ],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const tickets = await ticketService.getByUser('u1');
      expect(tickets).toHaveLength(2);
    });
  });

  describe('getAll', () => {
    it('returns all tickets without filters', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 't1' }, { id: 't2' }, { id: 't3' }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const tickets = await ticketService.getAll();
      expect(tickets).toHaveLength(3);
    });

    it('filters by status', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 't1', status: 'open' }],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const tickets = await ticketService.getAll({ status: 'open' });
      expect(tickets).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates ticket status and notifies user', async () => {
      const fromChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 't1', user_id: 'u1', title: 'My Bug',
            status: 'resolved', admin_notes: 'Fixed',
          },
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const result = await ticketService.update('t1', 'admin1', {
        status: 'resolved', admin_notes: 'Fixed',
      });

      expect(result.status).toBe('resolved');
    });

    it('throws on update failure', async () => {
      const fromChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(
        ticketService.update('t999', 'admin1', { status: 'resolved' })
      ).rejects.toThrow('Failed to update ticket');
    });
  });

  describe('getStats', () => {
    it('returns ticket statistics', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ count: 3 }),
        } as any;
      });

      const stats = await ticketService.getStats();
      expect(stats).toHaveProperty('open');
      expect(stats).toHaveProperty('inProgress');
      expect(stats).toHaveProperty('resolved');
      expect(stats).toHaveProperty('total');
    });
  });
});
