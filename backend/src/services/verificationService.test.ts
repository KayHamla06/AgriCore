// ============================================
// AgriCore — Verification Service Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verificationService } from '../services/verificationService';
import { supabaseAdmin } from '../config/supabaseClient';

function createTwoStepEqChain(result: { error: any }) {
  let callCount = 0;
  const chain: { eq: ReturnType<typeof vi.fn> } = {
    eq: vi.fn().mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return chain;
      }

      return Promise.resolve(result);
    }),
  };

  return chain;
}

vi.mock('../services/notificationService', () => ({
  notificationService: {
    create: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../services/activityLogService', () => ({
  activityLogService: {
    log: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../config', () => ({
  config: {
    storageBucket: 'test-bucket',
  },
}));

describe('VerificationService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getUserDocuments', () => {
    it('returns documents for a user', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 'doc1', user_id: 'u1', document_type: 'id_document', status: 'pending' },
            { id: 'doc2', user_id: 'u1', document_type: 'farm_registration', status: 'approved' },
          ],
          error: null,
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      const docs = await verificationService.getUserDocuments('u1');
      expect(docs).toHaveLength(2);
      expect(docs[0].id).toBe('doc1');
    });

    it('throws on database error', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(verificationService.getUserDocuments('u1')).rejects.toThrow('Failed to fetch documents');
    });
  });

  describe('getStatus', () => {
    it('returns verification status and documents', async () => {
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { verification_status: 'verified' },
              error: null,
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [{ id: 'doc1', document_type: 'id_document' }],
            error: null,
          }),
        } as any;
      });

      const result = await verificationService.getStatus('u1');
      expect(result.status).toBe('verified');
      expect(result.documents).toHaveLength(1);
    });

    it('throws if user not found', async () => {
      const fromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(fromChain as any);

      await expect(verificationService.getStatus('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('approveUser', () => {
    it('approves a user and updates documents', async () => {
      let userCallCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'users') {
          userCallCount += 1;
          if (userCallCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: 'farmer', email: 'u1@test.com', verification_status: 'pending' },
                error: null,
              }),
            } as any;
          }

          if (userCallCount === 2) {
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ error: null }),
            } as any;
          }

          if (userCallCount === 3) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Admin' }, error: null }),
            } as any;
          }

          return {
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        if (table === 'farmers') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        if (table === 'verification_documents') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          } as any;
        }
        if (table === 'verification_requests') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          } as any;
        }
        // Remaining calls (notifications, etc.)
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      await expect(verificationService.approveUser('u1', 'admin1', 'Looks good'))
        .resolves.not.toThrow();
    });

    it('throws on database error', async () => {
      let usersCallCount = 0;

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'users') {
          usersCallCount += 1;

          if (usersCallCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: 'farmer', email: 'u1@test.com', verification_status: 'pending' },
                error: null,
              }),
            } as any;
          }

          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
            }),
          } as any;
        }
        if (table === 'farmers') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }

        return {
          update: vi.fn().mockReturnValue(createTwoStepEqChain({ error: { message: 'DB error' } })),
        } as any;
      });

      await expect(verificationService.approveUser('u1', 'admin1'))
        .rejects.toThrow('Failed to update user verification status');
    });
  });

  describe('rejectUser', () => {
    it('rejects a user and updates documents', async () => {
      let userCallCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'users') {
          userCallCount += 1;
          if (userCallCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: 'farmer', verification_status: 'pending' },
                error: null,
              }),
            } as any;
          }

          if (userCallCount === 2) {
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ error: null }),
            } as any;
          }

          if (userCallCount === 3) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Admin' }, error: null }),
            } as any;
          }

          return {
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        if (table === 'farmers') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        if (table === 'verification_documents') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          } as any;
        }
        if (table === 'verification_requests') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      await expect(verificationService.rejectUser('u1', 'admin1', 'Invalid ID'))
        .resolves.not.toThrow();
    });

    it('throws on database error', async () => {
      let usersCallCount = 0;

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'users') {
          usersCallCount += 1;

          if (usersCallCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { verification_status: 'pending' },
                error: null,
              }),
            } as any;
          }

          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
            }),
          } as any;
        }
        if (table === 'farmers') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }

        return {
          update: vi.fn().mockReturnValue(createTwoStepEqChain({ error: { message: 'DB error' } })),
        } as any;
      });

      await expect(verificationService.rejectUser('u1', 'admin1'))
        .rejects.toThrow('Failed to update user verification status');
    });
  });

  describe('getPendingRequests', () => {
    it('returns users with pending status and documents', async () => {
      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'u1', name: 'Farmer A', email: 'a@test.com', role: 'farmer', verification_status: 'pending', created_at: '2024-01-01' },
              ],
              error: null,
            }),
          } as any;
        }

        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [{ id: 'doc1', user_id: 'u1', document_type: 'id_document' }],
            error: null,
          }),
        } as any;
      });

      const results = await verificationService.getPendingRequests();
      expect(results).toHaveLength(1);
      expect(results[0].documents).toHaveLength(1);
    });

    it('rolls back canonical status if document sync fails during approval', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'users') {
          const updateChain = {
            eq: vi.fn()
              .mockResolvedValueOnce({ error: null })
              .mockResolvedValueOnce({ error: null }),
          };

          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'farmer', email: 'u1@test.com', verification_status: 'pending' },
              error: null,
            }),
            update: vi.fn().mockReturnValue(updateChain),
          } as any;
        }

        if (table === 'verification_documents') {
          return {
            update: vi.fn().mockReturnValue(createTwoStepEqChain({ error: { message: 'DB error' } })),
          } as any;
        }

        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        } as any;
      });

      await expect(verificationService.approveUser('u1', 'admin1')).rejects.toThrow('Failed to approve verification documents');
    });
  });

  describe('uploadDocument', () => {
    it('rejects invalid file types', async () => {
      const file = {
        mimetype: 'application/zip',
        size: 1024,
        originalname: 'test.zip',
        buffer: Buffer.from('test'),
      } as any;

      await expect(verificationService.uploadDocument('u1', 'id_document', file))
        .rejects.toThrow('Invalid file type');
    });

    it('rejects files over 10 MB', async () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 11 * 1024 * 1024,
        originalname: 'big.jpg',
        buffer: Buffer.from('test'),
      } as any;

      await expect(verificationService.uploadDocument('u1', 'id_document', file))
        .rejects.toThrow('File too large');
    });
  });
});
