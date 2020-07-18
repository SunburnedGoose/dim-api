import { transaction, pool } from '.';
import { recordAuditLog, getAuditLog, trimAuditLog } from './audit-log-queries';
import { AuditLogEntry } from '../shapes/audit-log';

const appId = 'settings-queries-test-app';
const platformMembershipId = '213512057';
const bungieMembershipId = 1234;

beforeEach(async () => {
  await pool.query({
    text: 'delete from audit_log where membership_id = $1',
    values: [bungieMembershipId],
  });
});

afterAll(() => pool.end());

it('can insert audit logs', async () => {
  await transaction(async (client) => {
    const entry: AuditLogEntry = {
      type: 'tag_cleanup',
      platformMembershipId,
      destinyVersion: 2,
      payload: {
        deleted: 1,
      },
      createdBy: appId,
    };
    await recordAuditLog(client, bungieMembershipId, entry);

    const logs = await getAuditLog(client, bungieMembershipId);

    entry.createdAt = logs[0].createdAt;
    expect(logs[0]).toEqual(entry);
  });
});

it('can trim the audit log history', async () => {
  await transaction(async (client) => {
    const entry: AuditLogEntry = {
      type: 'tag_cleanup',
      platformMembershipId,
      destinyVersion: 2,
      payload: {
        deleted: 1,
      },
      createdBy: appId,
    };
    await recordAuditLog(client, bungieMembershipId, entry);
    await recordAuditLog(client, bungieMembershipId, entry);
    await recordAuditLog(client, bungieMembershipId, entry);
    await recordAuditLog(client, bungieMembershipId, entry);
    await recordAuditLog(client, bungieMembershipId, entry);

    const logs = await getAuditLog(client, bungieMembershipId);
    expect(logs.length).toEqual(5);

    await trimAuditLog(client, bungieMembershipId, 2);

    const logs2 = await getAuditLog(client, bungieMembershipId);
    expect(logs2.length).toEqual(2);
  });
});
