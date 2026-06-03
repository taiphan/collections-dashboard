/**
 * Seed script — creates a demo "acme" tenant with sample entity, form, and
 * case type so a developer can poke around the UI immediately.
 *
 * Run with: `npm run db:seed`
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/lib/db/client';
import { schema } from '../src/lib/db/schema';

async function main(): Promise<void> {
  const db = getDb();

  // 1) Tenant
  const existing = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.subdomain, 'acme'))
    .limit(1);
  if (existing[0]) {
    console.log('Seed: acme tenant already exists. Re-run on a fresh DB to reseed.');
    return;
  }

  const [tenant] = await db
    .insert(schema.tenants)
    .values({ subdomain: 'acme', name: 'Acme Inc.' })
    .returning();

  // 2) Users
  const passwordHash = await bcrypt.hash('password123', 12);
  const [admin] = await db
    .insert(schema.users)
    .values({
      email: 'admin@acme.test',
      passwordHash,
      displayName: 'Acme Admin',
    })
    .returning();
  const [worker] = await db
    .insert(schema.users)
    .values({
      email: 'worker@acme.test',
      passwordHash,
      displayName: 'Acme Worker',
    })
    .returning();

  await db.insert(schema.memberships).values([
    {
      tenantId: tenant!.id,
      userId: admin!.id,
      roles: ['platform_admin', 'app_designer', 'manager'],
    },
    {
      tenantId: tenant!.id,
      userId: worker!.id,
      roles: ['case_worker'],
    },
  ]);

  // 3) Entity
  const [entity] = await db
    .insert(schema.entities)
    .values({
      tenantId: tenant!.id,
      name: 'loan_application',
      label: 'Loan Application',
    })
    .returning();
  const entityDef = {
    fields: [
      { id: '11111111-1111-4111-8111-111111111111', kind: 'text', name: 'applicant_name', label: 'Applicant Name', required: true },
      { id: '22222222-2222-4222-8222-222222222222', kind: 'number', name: 'amount', label: 'Amount', required: true, integer: true },
      { id: '33333333-3333-4333-8333-333333333333', kind: 'select', name: 'priority', label: 'Priority', required: false, options: ['low', 'medium', 'high'] },
    ],
    relationships: [],
  };
  const [entityVersion] = await db
    .insert(schema.entityVersions)
    .values({
      tenantId: tenant!.id,
      entityId: entity!.id,
      version: 1,
      definition: entityDef,
      createdBy: admin!.id,
    })
    .returning();
  await db
    .update(schema.entities)
    .set({ publishedVersion: 1 })
    .where(eq(schema.entities.id, entity!.id));

  // 4) Form
  const [form] = await db
    .insert(schema.forms)
    .values({
      tenantId: tenant!.id,
      name: 'loan_intake',
      label: 'Loan Intake',
      entityId: entity!.id,
    })
    .returning();
  const formDef = {
    entityId: entity!.id,
    rootComponentIds: ['c-name', 'c-amount', 'c-priority'],
    components: [
      { id: 'c-name', kind: 'text_input', fieldPath: 'applicant_name', label: 'Applicant Name', validation: [{ kind: 'required' }] },
      { id: 'c-amount', kind: 'number_input', fieldPath: 'amount', label: 'Amount', validation: [{ kind: 'required' }, { kind: 'min', value: 1 }] },
      { id: 'c-priority', kind: 'select', fieldPath: 'priority', label: 'Priority' },
    ],
  };
  await db
    .insert(schema.formVersions)
    .values({
      tenantId: tenant!.id,
      formId: form!.id,
      version: 1,
      definition: formDef,
      createdBy: admin!.id,
    });
  await db
    .update(schema.forms)
    .set({ publishedVersion: 1 })
    .where(eq(schema.forms.id, form!.id));

  // 5) Case type
  const [caseType] = await db
    .insert(schema.caseTypes)
    .values({
      tenantId: tenant!.id,
      name: 'loan_origination',
      label: 'Loan Origination',
      primaryEntityId: entity!.id,
    })
    .returning();
  const caseTypeDef = {
    primaryEntityId: entity!.id,
    sla: { targetMinutes: 60, warningMinutes: 30 },
    stages: [
      {
        id: 'intake',
        name: 'Intake',
        steps: [
          {
            id: 'collect_info',
            name: 'Collect application info',
            kind: 'form_step',
            formId: form!.id,
            assignment: { kind: 'specific_role', role: 'case_worker' },
          },
        ],
      },
      {
        id: 'review',
        name: 'Review',
        sla: { targetMinutes: 30, warningMinutes: 10 },
        steps: [
          {
            id: 'manager_review',
            name: 'Manager review',
            kind: 'approval_step',
            assignment: { kind: 'specific_role', role: 'manager' },
            approveTarget: { kind: 'stage', stageId: 'closed' },
            rejectTarget: { kind: 'step', stepId: 'collect_info' },
            sendBack: [
              { id: 'sb1', targetStepId: 'collect_info', label: 'Send back to intake' },
            ],
          },
        ],
      },
      {
        id: 'closed',
        name: 'Closed',
        steps: [{ id: 'finish', name: 'Finish', kind: 'automated_step' }],
      },
    ],
  };
  await db
    .insert(schema.caseTypeVersions)
    .values({
      tenantId: tenant!.id,
      caseTypeId: caseType!.id,
      version: 1,
      definition: caseTypeDef,
      createdBy: admin!.id,
    });
  await db
    .update(schema.caseTypes)
    .set({ publishedVersion: 1 })
    .where(eq(schema.caseTypes.id, caseType!.id));

  console.log('Seed complete.');
  console.log(`Tenant: acme  (id ${tenant!.id})`);
  console.log('Login:  admin@acme.test / password123  (admin + manager + designer)');
  console.log('Login:  worker@acme.test / password123 (case worker)');
  console.log(`Entity ${entityVersion!.version}: ${entity!.name}`);
  console.log(`Form: ${form!.name}`);
  console.log(`Case type: ${caseType!.name}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
