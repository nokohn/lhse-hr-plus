import { EnterpriseDocument, DocumentVersion, VersionChangeType } from '../types/index.ts';

export const initialEnterpriseDocuments: EnterpriseDocument[] = [
  {
    id: 'doc-001',
    docNumber: 'LHSE-DOC-2026-001',
    title: 'LHSE Standard Employment Contract Template',
    titleLao: 'ສັນຍາຈ້າງງານມາດຕະຖານ ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ',
    category: 'CONTRACT',
    description: 'Official bilateral employment agreement adhering to Lao PDR Labor Law (Amended 2024), covering compensation, probation, intellectual property, and statutory benefits.',
    descriptionLao: 'ສັນຍາຈ້າງງານສອງຝ່າຍ ຕາມກົດໝາຍວ່າດ້ວຍແຮງງານ ແຫ່ງ ສປປ ລາວ ສະບັບປັບປຸງ ປີ 2024, ຄຸ້ມຄອງເງິນເດືອນ, ການທົດລອງວຽກ ແລະ ສະຫວັດດີການ.',
    departmentId: 'd-2', // HR & Admin
    currentVersion: 'v2.1',
    fileType: 'DOCX',
    fileSize: '34.2 KB',
    status: 'ACTIVE',
    lastModifiedAt: '2026-10-18T14:30:00Z',
    lastModifiedBy: 'Soukavanh Vongvichit',
    lastModifiedByRole: 'HR & Admin Director',
    tags: ['Employee Contract', 'Confidential', 'Labor Law', 'HR Policy'],
    content: `ບົດສັນຍາຈ້າງງານມາດຕະຖານ (LHSE STANDARD EMPLOYMENT CONTRACT)

ມາດຕາ 1: ຈຸດປະສົງ ແລະ ຕຳແໜ່ງງານ (Article 1: Purpose & Position)
1.1 ຜູ້ວ່າຈ້າງ ຕົກລົງຮັບເອົາ ລູກຈ້າງ ເຂົ້າເຮັດວຽກໃນຕຳແໜ່ງທີ່ໄດ້ກຳນົດໄວ້ໃນເອກະສານຊ້ອນທ້າຍ, ປະຕິບັດໜ້າທີ່ພາຍໃຕ້ການຊີ້ນຳຂອງຫົວໜ້າພະແນກທີ່ກ່ຽວຂ້ອງ.
1.2 ໄລຍະເວລາທົດລອງວຽກແມ່ນ 60 ວັນ ສຳລັບວຽກງານວິຊາການ ແລະ 90 ວັນ ສຳລັບຕຳແໜ່ງຄຸ້ມຄອງບໍລິຫານ.

ມາດຕາ 2: ເວລາເຮັດວຽກ ແລະ ວັນພັກ (Article 2: Working Hours & Holidays)
2.1 ເວລາເຮັດວຽກປົກກະຕິແມ່ນ 8 ຊົ່ວໂມງຕໍ່ວັນ (08:00 - 17:00 ໂມງ) ວັນຈັນ ຫາ ວັນສຸກ, ລວມ 40 ຊົ່ວໂມງຕໍ່ອາທິດ.
2.2 ລູກຈ້າງມີສິດໄດ້ຮັບວັນພັກປະຈຳປີ 15 ວັນເຮັດວຽກ ໂດຍໄດ້ຮັບເງິນເດືອນເຕັມ ຫຼັງຈາກເຮັດວຽກຄົບ 1 ປີ.
2.3 ລູກຈ້າງຍິງມີສິດລາເກີດລູກ 105 ວັນ ຕາມກົດໝາຍແຮງງານ ສປປ ລາວ.

ມາດຕາ 3: ເງິນເດືອນ ແລະ ສະຫວັດດີການ (Article 3: Remuneration & Benefits)
3.1 ຜູ້ວ່າຈ້າງຈະຈ່າຍເງິນເດືອນຜ່ານບັນຊີທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL Corporate Payroll) ບໍ່ເກີນວັນທີ 28 ຂອງທຸກໆເດືອນ.
3.2 ຜູ້ວ່າຈ້າງ ແລະ ລູກຈ້າງ ຈະປະກອບສ່ວນເຂົ້າກອງທຶນປະກັນສັງຄົມແຫ່ງຊາດ (LSSO): ລູກຈ້າງ 5.5% ແລະ ຜູ້ວ່າຈ້າງ 6.0%.
3.3 ເງິນອຸດໜູນປະຈຳຕຳແໜ່ງ, ເງິນໂບນັດປະຈຳປີ ແລະ ຄ່າຄອງຊີບ ຈະຖືກພິຈາລະນາຕາມຜົນການປະເມີນ KPI ແລະ ມະຕິກອງປະຊຸມສະພາບໍລິຫານ LHSE.

ມາດຕາ 4: ການຮັກສາຄວາມລັບ ແລະ ຊັບສິນທາງປັນຍາ (Article 4: Confidentiality & IP)
4.1 ລູກຈ້າງຕ້ອງຮັກສາຄວາມລັບຂອງຂໍ້ມູນທາງທຸລະກິດ, ໂຄງການພະລັງງານ ແລະ ການລົງທຶນຂອງ LHSE ຢ່າງເຂັ້ມງວດ.
4.2 ຜົນງານ, ການຄົ້ນຄວ້າ ແລະ ເອກະສານທີ່ສ້າງຂຶ້ນໃນລະຫວ່າງການເຮັດວຽກ ຖືເປັນກຳມະສິດແຫ່ງລັດຂອງ LHSE.

ມາດຕາ 5: ການສິ້ນສຸດສັນຍາ ແລະ ເງິນອຸດໜູນ (Article 5: Termination & Severance)
5.1 ຝ່າຍໃດຝ່າຍໜຶ່ງສາມາດບອກເລີກສັນຍາໄດ້ ໂດຍແຈ້ງເປັນລາຍລັກອັກສອນລ່ວງໜ້າຢ່າງໜ້ອຍ 30 ວັນ ສຳລັບວຽກງານທົ່ວໄປ ແລະ 45 ວັນ ສຳລັບຕຳແໜ່ງວິຊາຊີບສະເພາະ.
5.2 ການຈ່າຍເງິນອຸດໜູນສິ້ນສຸດສັນຍາ ຈະປະຕິບັດຕາມມາດຕາ 90 ຂອງກົດໝາຍວ່າດ້ວຍແຮງງານ ແຫ່ງ ສປປ ລາວ.`,
    versions: [
      {
        id: 'ver-001-3',
        documentId: 'doc-001',
        version: 'v2.1',
        title: 'LHSE Standard Employment Contract Template',
        titleLao: 'ສັນຍາຈ້າງງານມາດຕະຖານ ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ',
        content: `ບົດສັນຍາຈ້າງງານມາດຕະຖານ (LHSE STANDARD EMPLOYMENT CONTRACT)

ມາດຕາ 1: ຈຸດປະສົງ ແລະ ຕຳແໜ່ງງານ (Article 1: Purpose & Position)
1.1 ຜູ້ວ່າຈ້າງ ຕົກລົງຮັບເອົາ ລູກຈ້າງ ເຂົ້າເຮັດວຽກໃນຕຳແໜ່ງທີ່ໄດ້ກຳນົດໄວ້ໃນເອກະສານຊ້ອນທ້າຍ, ປະຕິບັດໜ້າທີ່ພາຍໃຕ້ການຊີ້ນຳຂອງຫົວໜ້າພະແນກທີ່ກ່ຽວຂ້ອງ.
1.2 ໄລຍະເວລາທົດລອງວຽກແມ່ນ 60 ວັນ ສຳລັບວຽກງານວິຊາການ ແລະ 90 ວັນ ສຳລັບຕຳແໜ່ງຄຸ້ມຄອງບໍລິຫານ.

ມາດຕາ 2: ເວລາເຮັດວຽກ ແລະ ວັນພັກ (Article 2: Working Hours & Holidays)
2.1 ເວລາເຮັດວຽກປົກກະຕິແມ່ນ 8 ຊົ່ວໂມງຕໍ່ວັນ (08:00 - 17:00 ໂມງ) ວັນຈັນ ຫາ ວັນສຸກ, ລວມ 40 ຊົ່ວໂມງຕໍ່ອາທິດ.
2.2 ລູກຈ້າງມີສິດໄດ້ຮັບວັນພັກປະຈຳປີ 15 ວັນເຮັດວຽກ ໂດຍໄດ້ຮັບເງິນເດືອນເຕັມ ຫຼັງຈາກເຮັດວຽກຄົບ 1 ປີ.
2.3 ລູກຈ້າງຍິງມີສິດລາເກີດລູກ 105 ວັນ ຕາມກົດໝາຍແຮງງານ ສປປ ລາວ.

ມາດຕາ 3: ເງິນເດືອນ ແລະ ສະຫວັດດີການ (Article 3: Remuneration & Benefits)
3.1 ຜູ້ວ່າຈ້າງຈະຈ່າຍເງິນເດືອນຜ່ານບັນຊີທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL Corporate Payroll) ບໍ່ເກີນວັນທີ 28 ຂອງທຸກໆເດືອນ.
3.2 ຜູ້ວ່າຈ້າງ ແລະ ລູກຈ້າງ ຈະປະກອບສ່ວນເຂົ້າກອງທຶນປະກັນສັງຄົມແຫ່ງຊາດ (LSSO): ລູກຈ້າງ 5.5% ແລະ ຜູ້ວ່າຈ້າງ 6.0%.
3.3 ເງິນອຸດໜູນປະຈຳຕຳແໜ່ງ, ເງິນໂບນັດປະຈຳປີ ແລະ ຄ່າຄອງຊີບ ຈະຖືກພິຈາລະນາຕາມຜົນການປະເມີນ KPI ແລະ ມະຕິກອງປະຊຸມສະພາບໍລິຫານ LHSE.

ມາດຕາ 4: ການຮັກສາຄວາມລັບ ແລະ ຊັບສິນທາງປັນຍາ (Article 4: Confidentiality & IP)
4.1 ລູກຈ້າງຕ້ອງຮັກສາຄວາມລັບຂອງຂໍ້ມູນທາງທຸລະກິດ, ໂຄງການພະລັງງານ ແລະ ການລົງທຶນຂອງ LHSE ຢ່າງເຂັ້ມງວດ.
4.2 ຜົນງານ, ການຄົ້ນຄວ້າ ແລະ ເອກະສານທີ່ສ້າງຂຶ້ນໃນລະຫວ່າງການເຮັດວຽກ ຖືເປັນກຳມະສິດແຫ່ງລັດຂອງ LHSE.

ມາດຕາ 5: ການສິ້ນສຸດສັນຍາ ແລະ ເງິນອຸດໜູນ (Article 5: Termination & Severance)
5.1 ຝ່າຍໃດຝ່າຍໜຶ່ງສາມາດບອກເລີກສັນຍາໄດ້ ໂດຍແຈ້ງເປັນລາຍລັກອັກສອນລ່ວງໜ້າຢ່າງໜ້ອຍ 30 ວັນ ສຳລັບວຽກງານທົ່ວໄປ ແລະ 45 ວັນ ສຳລັບຕຳແໜ່ງວິຊາຊີບສະເພາະ.
5.2 ການຈ່າຍເງິນອຸດໜູນສິ້ນສຸດສັນຍາ ຈະປະຕິບັດຕາມມາດຕາ 90 ຂອງກົດໝາຍວ່າດ້ວຍແຮງງານ ແຫ່ງ ສປປ ລາວ.`,
        changeSummary: 'Amended Article 3.1 clarifying BCEL Corporate OnePay schedule and added Article 3.3 linking annual bonuses directly to KPI quarterly attainment.',
        changeType: 'MINOR',
        changedBy: 'Soukavanh Vongvichit',
        changedByRole: 'HR & Admin Director',
        changedAt: '2026-10-18T14:30:00Z',
        fileSize: '34.2 KB',
        status: 'ACTIVE',
      },
      {
        id: 'ver-001-2',
        documentId: 'doc-001',
        version: 'v2.0',
        title: 'LHSE Standard Employment Contract Template',
        titleLao: 'ສັນຍາຈ້າງງານມາດຕະຖານ ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ',
        content: `ບົດສັນຍາຈ້າງງານມາດຕະຖານ (LHSE STANDARD EMPLOYMENT CONTRACT)

ມາດຕາ 1: ຈຸດປະສົງ ແລະ ຕຳແໜ່ງງານ (Article 1: Purpose & Position)
1.1 ຜູ້ວ່າຈ້າງ ຕົກລົງຮັບເອົາ ລູກຈ້າງ ເຂົ້າເຮັດວຽກໃນຕຳແໜ່ງທີ່ໄດ້ກຳນົດໄວ້ໃນເອກະສານຊ້ອນທ້າຍ, ປະຕິບັດໜ້າທີ່ພາຍໃຕ້ການຊີ້ນຳຂອງຫົວໜ້າພະແນກທີ່ກ່ຽວຂ້ອງ.
1.2 ໄລຍະເວລາທົດລອງວຽກແມ່ນ 60 ວັນ.

ມາດຕາ 2: ເວລາເຮັດວຽກ ແລະ ວັນພັກ (Article 2: Working Hours & Holidays)
2.1 ເວລາເຮັດວຽກປົກກະຕິແມ່ນ 8 ຊົ່ວໂມງຕໍ່ວັນ (08:00 - 17:00 ໂມງ) ວັນຈັນ ຫາ ວັນສຸກ, ລວມ 40 ຊົ່ວໂມງຕໍ່ອາທິດ.
2.2 ລູກຈ້າງມີສິດໄດ້ຮັບວັນພັກປະຈຳປີ 15 ວັນເຮັດວຽກ ໂດຍໄດ້ຮັບເງິນເດືອນເຕັມ.
2.3 ລູກຈ້າງຍິງມີສິດລາເກີດລູກ 105 ວັນ ຕາມກົດໝາຍແຮງງານ ສປປ ລາວ 2024.

ມາດຕາ 3: ເງິນເດືອນ ແລະ ສະຫວັດດີການ (Article 3: Remuneration & Benefits)
3.1 ຜູ້ວ່າຈ້າງຈະຈ່າຍເງິນເດືອນທ້າຍເດືອນ ຜ່ານບັນຊີທະນາຄານ.
3.2 ປະກອບສ່ວນເຂົ້າກອງທຶນປະກັນສັງຄົມແຫ່ງຊາດ (LSSO): ລູກຈ້າງ 5.5% ແລະ ຜູ້ວ່າຈ້າງ 6.0%.

ມາດຕາ 4: ການຮັກສາຄວາມລັບ (Article 4: Confidentiality)
4.1 ລູກຈ້າງຕ້ອງຮັກສາຄວາມລັບຂອງຂໍ້ມູນທາງທຸລະກິດ ແລະ ໂຄງການພະລັງງານຂອງ LHSE ຢ່າງເຂັ້ມງວດ.

ມາດຕາ 5: ການສິ້ນສຸດສັນຍາ (Article 5: Termination)
5.1 ບອກເລີກສັນຍາໄດ້ ໂດຍແຈ້ງເປັນລາຍລັກອັກສອນລ່ວງໜ້າຢ່າງໜ້ອຍ 30 ວັນ.
5.2 ການຈ່າຍເງິນອຸດໜູນປະຕິບັດຕາມກົດໝາຍແຮງງານ ສປປ ລາວ.`,
        changeSummary: 'Major restructuring: upgraded leave quotas for 2024 Labor Law reform (105 days maternity leave and 15 days annual leave guarantee).',
        changeType: 'MAJOR',
        changedBy: 'Khamla Phommavong',
        changedByRole: 'Legal & Compliance Officer',
        changedAt: '2026-06-12T09:15:00Z',
        fileSize: '31.8 KB',
        status: 'SUPERSEDED',
      },
      {
        id: 'ver-001-1',
        documentId: 'doc-001',
        version: 'v1.0',
        title: 'LHSE Initial Employment Agreement',
        titleLao: 'ສັນຍາຈ້າງງານເບື້ອງຕົ້ນ LHSE',
        content: `ບົດສັນຍາຈ້າງງານ (LHSE EMPLOYMENT AGREEMENT - 2025 BASELINE)

ມາດຕາ 1: ຈຸດປະສົງ (Article 1: Purpose)
1.1 ຜູ້ວ່າຈ້າງ ຕົກລົງຮັບເອົາ ລູກຈ້າງ ເຂົ້າເຮັດວຽກໃນຕຳແໜ່ງທີ່ໄດ້ກຳນົດໄວ້.
1.2 ໄລຍະເວລາທົດລອງວຽກແມ່ນ 90 ວັນ.

ມາດຕາ 2: ເວລາເຮັດວຽກ (Article 2: Working Hours)
2.1 ເວລາເຮັດວຽກ 08:00 - 17:00 ໂມງ ວັນຈັນ ຫາ ວັນສຸກ.
2.2 ວັນພັກປະຈຳປີ 12 ວັນເຮັດວຽກ.
2.3 ລາເກີດລູກ 90 ວັນ.

ມາດຕາ 3: ເງິນເດືອນ (Article 3: Salary)
3.1 ຈ່າຍເງິນເດືອນໃນວັນທີ 30 ຂອງທຸກໆເດືອນ.
3.2 ຫັກປະກັນສັງຄົມຕາມລະບຽບການ.

ມາດຕາ 4: ການສິ້ນສຸດສັນຍາ (Article 4: Termination)
4.1 ແຈ້ງລ່ວງໜ້າ 30 ວັນ.`,
        changeSummary: 'Initial baseline draft promulgated upon enterprise digital HR system initialization.',
        changeType: 'MAJOR',
        changedBy: 'Sengdao Souvannavong',
        changedByRole: 'Executive Director of Finance',
        changedAt: '2025-01-10T11:00:00Z',
        fileSize: '24.1 KB',
        status: 'SUPERSEDED',
      },
    ],
  },
  {
    id: 'doc-002',
    docNumber: 'LHSE-DOC-2026-002',
    title: 'Enterprise Code of Conduct & Anti-Corruption Policy',
    titleLao: 'ກົດລະບຽບວິໄນ ແລະ ນະໂຍບາຍຕ້ານການສໍ້ລາດບັງຫຼວງ LHSE',
    category: 'POLICY',
    description: 'Mandatory state enterprise governance standard detailing conflict of interest disclosures, gift registry thresholds, whistleblower protections, and procurement ethics.',
    descriptionLao: 'ມາດຕະຖານການຄຸ້ມຄອງລັດວິສາຫະກິດ ການແຈ້ງຜົນປະໂຫຍດທັບຊ້ອນ, ເກນການຮັບຂອງຂວັນ, ການປົກປ້ອງຜູ້ແຈ້ງເບາະແສ ແລະ ຈັນຍາບັນການຈັດຊື້-ຈັດຈ້າງ.',
    departmentId: 'd-5', // Legal & Audit
    currentVersion: 'v3.0',
    fileType: 'PDF',
    fileSize: '48.9 KB',
    status: 'ACTIVE',
    lastModifiedAt: '2026-09-01T16:00:00Z',
    lastModifiedBy: 'Bounleuth Luangrath',
    lastModifiedByRole: 'Managing Director & CEO',
    tags: ['Confidential', 'Governance', 'Integrity', 'Code of Conduct', 'Ethics'],
    content: `ກົດລະບຽບວິໄນ ແລະ ນະໂຍບາຍຕ້ານການສໍ້ລາດບັງຫຼວງ (LHSE CODE OF CONDUCT & ANTI-CORRUPTION POLICY)

ໝວດທີ 1: ຫຼັກການພື້ນຖານ ແລະ ຄວາມຊື່ສັດບໍລິສຸດ (Chapter 1: Foundational Principles & Integrity)
ຂໍ້ທີ 1.1 ພະນັກງານ LHSE ທຸກຂັ້ນ ຕ້ອງຍຶດໝັ້ນຄວາມຊື່ສັດບໍລິສຸດ, ຄວາມໂປ່ງໃສ ແລະ ຜົນປະໂຫຍດສູງສຸດຂອງລັດ ແລະ ປະຊາຊົນ.
ຂໍ້ທີ 1.2 ຫ້າມບໍ່ໃຫ້ຮຽກຮ້ອງ, ຮັບເອົາ ຫຼື ຕົກລົງທີ່ຈະຮັບສິນບົນ, ເງິນຕອບແທນ ຫຼື ຜົນປະໂຫຍດອື່ນໆ ຈາກຜູ້ຮັບເໝົາ ຫຼື ຄູ່ຮ່ວມລົງທຶນ.

ໝວດທີ 2: ການຄຸ້ມຄອງຜົນປະໂຫຍດທັບຊ້ອນ (Chapter 2: Conflicts of Interest)
ຂໍ້ທີ 2.1 ພະນັກງານທຸກຄົນຕ້ອງແຈ້ງລາຍການຜົນປະໂຫຍດທັບຊ້ອນ (Declaration of Conflict of Interest) ຕໍ່ພະແນກກວດກາ ແລະ ນິຕິກຳ ທຸກໆປີ.
ຂໍ້ທີ 2.2 ຫ້າມພະນັກງານມີສ່ວນຮ່ວມໃນການຕັດສິນໃຈຄັດເລືອກຜູ້ສະໜອງສິນຄ້າ/ບໍລິການ ຖ້າຫາກມີສາຍພົວພັນຍາດຕິພີ່ນ້ອງ ຫຼື ຜົນປະໂຫຍດທາງການເງິນ.

ໝວດທີ 3: ເກນການຮັບຂອງຂວັນ ແລະ ການລ້ຽງດູ (Chapter 3: Gift & Hospitality Thresholds)
ຂໍ້ທີ 3.1 ການຮັບຂອງຂວັນຕາມມາລະຍາດທາງທຸລະກິດ ຕ້ອງມີມູນຄ່າບໍ່ເກີນ 500,000 ກີບ (ຫ້າແສນກີບ).
ຂໍ້ທີ 3.2 ຂອງຂວັນທີ່ມີມູນຄ່າເກີນ 500,000 ກີບ ຕ້ອງລົງທະບຽນ ແລະ ມອບໃຫ້ເປັນຊັບສິນສ່ວນລວມຂອງ LHSE.

ໝວດທີ 4: ກົນໄກການປົກປ້ອງຜູ້ແຈ້ງເບາະແສ (Chapter 4: Whistleblower Protection)
ຂໍ້ທີ 4.1 LHSE ຮັບປະກັນການຮັກສາຄວາມລັບ 100% ສຳລັບຜູ້ແຈ້ງເບາະແສການກະທຳຜິດ ຫຼື ການສໍ້ລາດບັງຫຼວງ.
ຂໍ້ທີ 4.2 ຫ້າມການແກ້ແຄ້ນ, ຫຼຸດຕຳແໜ່ງ ຫຼື ຍົກເລີກສັນຍາຕໍ່ຜູ້ແຈ້ງເບາະແສ ໂດຍເດັດຂາດ.`,
    versions: [
      {
        id: 'ver-002-3',
        documentId: 'doc-002',
        version: 'v3.0',
        title: 'Enterprise Code of Conduct & Anti-Corruption Policy',
        titleLao: 'ກົດລະບຽບວິໄນ ແລະ ນະໂຍບາຍຕ້ານການສໍ້ລາດບັງຫຼວງ LHSE',
        content: `ກົດລະບຽບວິໄນ ແລະ ນະໂຍບາຍຕ້ານການສໍ້ລາດບັງຫຼວງ (LHSE CODE OF CONDUCT & ANTI-CORRUPTION POLICY)

ໝວດທີ 1: ຫຼັກການພື້ນຖານ ແລະ ຄວາມຊື່ສັດບໍລິສຸດ (Chapter 1: Foundational Principles & Integrity)
ຂໍ້ທີ 1.1 ພະນັກງານ LHSE ທຸກຂັ້ນ ຕ້ອງຍຶດໝັ້ນຄວາມຊື່ສັດບໍລິສຸດ, ຄວາມໂປ່ງໃສ ແລະ ຜົນປະໂຫຍດສູງສຸດຂອງລັດ ແລະ ປະຊາຊົນ.
ຂໍ້ທີ 1.2 ຫ້າມບໍ່ໃຫ້ຮຽກຮ້ອງ, ຮັບເອົາ ຫຼື ຕົກລົງທີ່ຈະຮັບສິນບົນ, ເງິນຕອບແທນ ຫຼື ຜົນປະໂຫຍດອື່ນໆ ຈາກຜູ້ຮັບເໝົາ ຫຼື ຄູ່ຮ່ວມລົງທຶນ.

ໝວດທີ 2: ການຄຸ້ມຄອງຜົນປະໂຫຍດທັບຊ້ອນ (Chapter 2: Conflicts of Interest)
ຂໍ້ທີ 2.1 ພະນັກງານທຸກຄົນຕ້ອງແຈ້ງລາຍການຜົນປະໂຫຍດທັບຊ້ອນ (Declaration of Conflict of Interest) ຕໍ່ພະແນກກວດກາ ແລະ ນິຕິກຳ ທຸກໆປີ.
ຂໍ້ທີ 2.2 ຫ້າມພະນັກງານມີສ່ວນຮ່ວມໃນການຕັດສິນໃຈຄັດເລືອກຜູ້ສະໜອງສິນຄ້າ/ບໍລິການ ຖ້າຫາກມີສາຍພົວພັນຍາດຕິພີ່ນ້ອງ ຫຼື ຜົນປະໂຫຍດທາງການເງິນ.

ໝວດທີ 3: ເກນການຮັບຂອງຂວັນ ແລະ ການລ້ຽງດູ (Chapter 3: Gift & Hospitality Thresholds)
ຂໍ້ທີ 3.1 ການຮັບຂອງຂວັນຕາມມາລະຍາດທາງທຸລະກິດ ຕ້ອງມີມູນຄ່າບໍ່ເກີນ 500,000 ກີບ (ຫ້າແສນກີບ).
ຂໍ້ທີ 3.2 ຂອງຂວັນທີ່ມີມູນຄ່າເກີນ 500,000 ກີບ ຕ້ອງລົງທະບຽນ ແລະ ມອບໃຫ້ເປັນຊັບສິນສ່ວນລວມຂອງ LHSE.

ໝວດທີ 4: ກົນໄກການປົກປ້ອງຜູ້ແຈ້ງເບາະແສ (Chapter 4: Whistleblower Protection)
ຂໍ້ທີ 4.1 LHSE ຮັບປະກັນການຮັກສາຄວາມລັບ 100% ສຳລັບຜູ້ແຈ້ງເບາະແສການກະທຳຜິດ ຫຼື ການສໍ້ລາດບັງຫຼວງ.
ຂໍ້ທີ 4.2 ຫ້າມການແກ້ແຄ້ນ, ຫຼຸດຕຳແໜ່ງ ຫຼື ຍົກເລີກສັນຍາຕໍ່ຜູ້ແຈ້ງເບາະແສ ໂດຍເດັດຂາດ.`,
        changeSummary: 'Major Version 3.0: Enacted Chapter 4 Whistleblower Protection and lowered gift disclosure limit to 500,000 LAK per State Inspection recommendations.',
        changeType: 'MAJOR',
        changedBy: 'Bounleuth Luangrath',
        changedByRole: 'Managing Director & CEO',
        changedAt: '2026-09-01T16:00:00Z',
        fileSize: '48.9 KB',
        status: 'ACTIVE',
      },
      {
        id: 'ver-002-2',
        documentId: 'doc-002',
        version: 'v2.0',
        title: 'Enterprise Code of Conduct & Integrity Guidelines',
        titleLao: 'ກົດລະບຽບວິໄນ ແລະ ຄູ່ມືຄວາມຊື່ສັດສຸຈະລິດ LHSE',
        content: `ກົດລະບຽບວິໄນ ແລະ ຄູ່ມືຄວາມຊື່ສັດສຸຈະລິດ LHSE (VERSION 2.0)

ໝວດທີ 1: ຫຼັກການພື້ນຖານ (Chapter 1: Principles)
ຂໍ້ທີ 1.1 ພະນັກງານຕ້ອງມີຄວາມຊື່ສັດບໍລິສຸດ ແລະ ໂປ່ງໃສ.
ຂໍ້ທີ 1.2 ຫ້າມຮັບສິນບົນ ຫຼື ສິ່ງຕອບແທນ.

ໝວດທີ 2: ຜົນປະໂຫຍດທັບຊ້ອນ (Chapter 2: Conflicts)
ຂໍ້ທີ 2.1 ຕ້ອງລາຍງານເມື່ອພົບເຫັນການຂັດກັນຂອງຜົນປະໂຫຍດ.

ໝວດທີ 3: ຂອງຂວັນ ແລະ ການຕ້ອນຮັບ (Chapter 3: Gifts)
ຂໍ້ທີ 3.1 ຂອງຂວັນບໍ່ເກີນ 1,000,000 ກີບ.`,
        changeSummary: 'Added Conflict of Interest chapter and established 1,000,000 LAK gift ceiling.',
        changeType: 'MAJOR',
        changedBy: 'Khamphanh Sayasane',
        changedByRole: 'Deputy Director of HR',
        changedAt: '2026-03-15T10:30:00Z',
        fileSize: '36.4 KB',
        status: 'SUPERSEDED',
      },
      {
        id: 'ver-002-1',
        documentId: 'doc-002',
        version: 'v1.0',
        title: 'LHSE Founding Code of Discipline',
        titleLao: 'ກົດລະບຽບພາຍໃນ LHSE ສະບັບເບື້ອງຕົ້ນ',
        content: `ກົດລະບຽບພາຍໃນ LHSE (VERSION 1.0)
1. ພະນັກງານຕ້ອງປະຕິບັດຕາມໂມງເວລາເຮັດວຽກ.
2. ຫ້າມສ້າງຄວາມເສຍຫາຍຕໍ່ຊັບສິນຂອງລັດ.
3. ຫ້າມນຳເອົາຄວາມລັບທາງລັດຖະການໄປເປີດເຜີຍ.`,
        changeSummary: 'Founding internal discipline code.',
        changeType: 'MAJOR',
        changedBy: 'Sengdao Souvannavong',
        changedByRole: 'Executive Director of Finance',
        changedAt: '2025-02-01T08:00:00Z',
        fileSize: '18.2 KB',
        status: 'SUPERSEDED',
      },
    ],
  },
  {
    id: 'doc-003',
    docNumber: 'LHSE-DOC-2026-003',
    title: 'Hydropower Concession Equity & Dividend Procedure',
    titleLao: 'ລະບຽບການຄຸ້ມຄອງຮຸ້ນ ແລະ ເງິນປັນຜົນໂຄງການໄຟຟ້າພະລັງນ້ຳ',
    category: 'PROCEDURE',
    description: 'Standard operating procedure for tracking state equity returns across Nam Theun 2, Hongsa Thermal, and Nam Ngiep 1, including quarterly audits and foreign exchange conversion.',
    descriptionLao: 'ຂັ້ນຕອນການຕິດຕາມເງິນປັນຜົນຮຸ້ນລັດ ໃນໂຄງການນ້ຳເທີນ 2, ຫົງສາ ແລະ ນ້ຳງຽບ 1, ລວມທັງການກວດສອບປະຈຳໄຕຣມາດ ແລະ ການແລກປ່ຽນເງິນຕາຕ່າງປະເທດ.',
    departmentId: 'd-4', // Energy Projects
    currentVersion: 'v1.3',
    fileType: 'DOCX',
    fileSize: '52.7 KB',
    status: 'ACTIVE',
    lastModifiedAt: '2026-10-10T11:45:00Z',
    lastModifiedBy: 'Khamphan Kittikhoun',
    lastModifiedByRole: 'Energy Projects Lead',
    tags: ['Tax', 'Confidential', 'Hydropower', 'Finance', 'Concession'],
    content: `ລະບຽບການຄຸ້ມຄອງຮຸ້ນ ແລະ ເງິນປັນຜົນໂຄງການໄຟຟ້າພະລັງນ້ຳ (HYDROPOWER CONCESSION EQUITY & DIVIDEND SOP)

ມາດຕາ 1: ຂອບເຂດການນຳໃຊ້ (Scope of Application)
1.1 ລະບຽບການສະບັບນີ້ ນຳໃຊ້ສຳລັບການຕິດຕາມ, ຄຸ້ມຄອງ ແລະ ຮັບເງິນປັນຜົນ ຈາກທຸກໂຄງການໄຟຟ້າທີ່ LHSE ຖືຮຸ້ນໃນນາມລັດຖະບານ ແຫ່ງ ສປປ ລາວ.
1.2 ໂຄງການຫຼັກພາຍໃຕ້ການຄຸ້ມຄອງ ປະກອບມີ: ໂຄງການນ້ຳເທີນ 2 (NT2), ໂຄງການໄຟຟ້າຄວາມຮ້ອນຫົງສາ (HPC), ແລະ ໂຄງການນ້ຳງຽບ 1 (NNP1).

ມາດຕາ 2: ການກວດສອບບັນຊີ ແລະ ໃບຢັ້ງຢືນການຜະລິດໄຟຟ້າ (Production & Financial Audits)
2.1 ທຸກໆທ້າຍໄຕຣມາດ ພະແນກໂຄງການພະລັງງານ ຕ້ອງປະສານງານກັບ EDL ເພື່ອກວດສອບຕົວເລກການຈຳໜ່າຍໄຟຟ້າ (Commercial Operation Date - COD) ແລະ ໃບແຈ້ງໜີ້.
2.2 ຕ້ອງກວດສອບລາຍງານການເງິນທີ່ຜ່ານການກວດສອບຈາກບໍລິສັດກວດສອບບັນຊີສາກົນ (Audited Financial Statements).

ມາດຕາ 3: ຂັ້ນຕອນການຮັບ ແລະ ໂອນເງິນປັນຜົນ (Dividend Receipt & Repatriation)
3.1 ເງິນປັນຜົນທີ່ເປັນສະກຸນເງິນໂດລາສະຫະລັດ (USD) ຕ້ອງໂອນເຂົ້າບັນຊີທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL Foreign Currency Reserve Account).
3.2 ການແລກປ່ຽນເປັນສະກຸນເງິນກີບ (LAK) ຕ້ອງອີງຕາມອັດຕາແລກປ່ຽນທາງການຂອງທະນາຄານແຫ່ງ ສປປ ລາວ (BOL Official Reference Rate).

ມາດຕາ 4: ການລາຍງານຕໍ່ກະຊວງການເງິນ (Reporting to Ministry of Finance)
4.1 ພະແນກການເງິນ LHSE ຕ້ອງສັງລວມລາຍຮັບເງິນປັນຜົນ ແລະ ຍື່ນບົດລາຍງານຕໍ່ກົມຄຸ້ມຄອງວິສາຫະກິດລັດ ພາຍໃນ 15 ວັນ ຫຼັງສິ້ນສຸດແຕ່ລະໄຕຣມາດ.`,
    versions: [
      {
        id: 'ver-003-3',
        documentId: 'doc-003',
        version: 'v1.3',
        title: 'Hydropower Concession Equity & Dividend Procedure',
        titleLao: 'ລະບຽບການຄຸ້ມຄອງຮຸ້ນ ແລະ ເງິນປັນຜົນໂຄງການໄຟຟ້າພະລັງນ້ຳ',
        content: `ລະບຽບການຄຸ້ມຄອງຮຸ້ນ ແລະ ເງິນປັນຜົນໂຄງການໄຟຟ້າພະລັງນ້ຳ (HYDROPOWER CONCESSION EQUITY & DIVIDEND SOP)

ມາດຕາ 1: ຂອບເຂດການນຳໃຊ້ (Scope of Application)
1.1 ລະບຽບການສະບັບນີ້ ນຳໃຊ້ສຳລັບການຕິດຕາມ, ຄຸ້ມຄອງ ແລະ ຮັບເງິນປັນຜົນ ຈາກທຸກໂຄງການໄຟຟ້າທີ່ LHSE ຖືຮຸ້ນໃນນາມລັດຖະບານ ແຫ່ງ ສປປ ລາວ.
1.2 ໂຄງການຫຼັກພາຍໃຕ້ການຄຸ້ມຄອງ ປະກອບມີ: ໂຄງການນ້ຳເທີນ 2 (NT2), ໂຄງການໄຟຟ້າຄວາມຮ້ອນຫົງສາ (HPC), ແລະ ໂຄງການນ້ຳງຽບ 1 (NNP1).

ມາດຕາ 2: ການກວດສອບບັນຊີ ແລະ ໃບຢັ້ງຢືນການຜະລິດໄຟຟ້າ (Production & Financial Audits)
2.1 ທຸກໆທ້າຍໄຕຣມາດ ພະແນກໂຄງການພະລັງງານ ຕ້ອງປະສານງານກັບ EDL ເພື່ອກວດສອບຕົວເລກການຈຳໜ່າຍໄຟຟ້າ (Commercial Operation Date - COD) ແລະ ໃບແຈ້ງໜີ້.
2.2 ຕ້ອງກວດສອບລາຍງານການເງິນທີ່ຜ່ານການກວດສອບຈາກບໍລິສັດກວດສອບບັນຊີສາກົນ (Audited Financial Statements).

ມາດຕາ 3: ຂັ້ນຕອນການຮັບ ແລະ ໂອນເງິນປັນຜົນ (Dividend Receipt & Repatriation)
3.1 ເງິນປັນຜົນທີ່ເປັນສະກຸນເງິນໂດລາສະຫະລັດ (USD) ຕ້ອງໂອນເຂົ້າບັນຊີທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL Foreign Currency Reserve Account).
3.2 ການແລກປ່ຽນເປັນສະກຸນເງິນກີບ (LAK) ຕ້ອງອີງຕາມອັດຕາແລກປ່ຽນທາງການຂອງທະນາຄານແຫ່ງ ສປປ ລາວ (BOL Official Reference Rate).

ມາດຕາ 4: ການລາຍງານຕໍ່ກະຊວງການເງິນ (Reporting to Ministry of Finance)
4.1 ພະແນກການເງິນ LHSE ຕ້ອງສັງລວມລາຍຮັບເງິນປັນຜົນ ແລະ ຍື່ນບົດລາຍງານຕໍ່ກົມຄຸ້ມຄອງວິສາຫະກິດລັດ ພາຍໃນ 15 ວັນ ຫຼັງສິ້ນສຸດແຕ່ລະໄຕຣມາດ.`,
        changeSummary: 'Updated Article 3.2 enforcing Bank of Lao PDR official exchange rate mechanisms for USD dividend repatriation.',
        changeType: 'MINOR',
        changedBy: 'Khamphan Kittikhoun',
        changedByRole: 'Energy Projects Lead',
        changedAt: '2026-10-10T11:45:00Z',
        fileSize: '52.7 KB',
        status: 'ACTIVE',
      },
      {
        id: 'ver-003-2',
        documentId: 'doc-003',
        version: 'v1.2',
        title: 'Hydropower Concession Equity & Dividend Procedure',
        titleLao: 'ລະບຽບການຄຸ້ມຄອງຮຸ້ນ ແລະ ເງິນປັນຜົນໂຄງການໄຟຟ້າພະລັງນ້ຳ',
        content: `ລະບຽບການຄຸ້ມຄອງຮຸ້ນ ແລະ ເງິນປັນຜົນໂຄງການໄຟຟ້າ (VERSION 1.2)
ມາດຕາ 1: ນຳໃຊ້ສຳລັບໂຄງການ NT2, HPC, NNP1.
ມາດຕາ 2: ກວດສອບລາຍງານການເງິນປະຈຳໄຕຣມາດ.
ມາດຕາ 3: ໂອນເງິນປັນຜົນເຂົ້າບັນຊີ BCEL.
ມາດຕາ 4: ລາຍງານຕໍ່ກະຊວງການເງິນທຸກໄຕຣມາດ.`,
        changeSummary: 'Added Nam Ngiep 1 project to standard audit scope.',
        changeType: 'PATCH',
        changedBy: 'Khamphan Kittikhoun',
        changedByRole: 'Energy Projects Lead',
        changedAt: '2026-05-20T14:10:00Z',
        fileSize: '46.1 KB',
        status: 'SUPERSEDED',
      },
      {
        id: 'ver-003-1',
        documentId: 'doc-003',
        version: 'v1.0',
        title: 'Equity Tracking SOP Initial Promulgation',
        titleLao: 'ລະບຽບການຕິດຕາມເງິນປັນຜົນ ເບື້ອງຕົ້ນ',
        content: `ລະບຽບການຕິດຕາມເງິນປັນຜົນ (VERSION 1.0)
1. ຕິດຕາມເງິນປັນຜົນຈາກໂຄງການນ້ຳເທີນ 2.
2. ໂອນເງິນເຂົ້າຄັງເງິນແຫ່ງລັດ.`,
        changeSummary: 'Initial operating procedure released.',
        changeType: 'MAJOR',
        changedBy: 'Bounleuth Luangrath',
        changedByRole: 'Managing Director & CEO',
        changedAt: '2025-04-01T09:00:00Z',
        fileSize: '22.0 KB',
        status: 'SUPERSEDED',
      },
    ],
  },
  {
    id: 'doc-004',
    docNumber: 'LHSE-DOC-2026-004',
    title: 'Enterprise Information Security & Data Protection Directive',
    titleLao: 'ຄຳສັ່ງແນະນຳຄວາມປອດໄພຂໍ້ມູນຂ່າວສານ ແລະ ປົກປ້ອງຂໍ້ມູນອົງກອນ',
    category: 'PROCEDURE',
    description: 'IT cybersecurity mandate enforcing mandatory MFA, role-based database privileges, encrypted cloud backups, and confidential energy concession file classification.',
    descriptionLao: 'ມາດຕະການຄວາມປອດໄພໄອທີ ບັງຄັບໃຊ້ MFA, ສິດທິຖານຂໍ້ມູນຕາມບົດບາດ, ການສຳຮອງຂໍ້ມູນແບບເຂົ້າລະຫັດ ແລະ ການຈັດຊັ້ນຄວາມລັບເອກະສານ.',
    departmentId: 'd-1', // Executive Office / IT
    currentVersion: 'v2.2',
    fileType: 'PDF',
    fileSize: '41.3 KB',
    status: 'ACTIVE',
    lastModifiedAt: '2026-10-15T09:00:00Z',
    lastModifiedBy: 'Souliyo Phanthavong',
    lastModifiedByRole: 'IT Systems Administrator',
    tags: ['Confidential', 'Cybersecurity', 'IT Policy', 'Data Protection'],
    content: `ຄຳສັ່ງແນະນຳຄວາມປອດໄພຂໍ້ມູນຂ່າວສານ (LHSE CYBERSECURITY & DATA DIRECTIVE)

ຂໍ້ທີ 1: ການພິສູດຕົວຕົນ ແລະ ລະຫັດຜ່ານ (Authentication & Password Standards)
1.1 ພະນັກງານທຸກຄົນຕ້ອງເປີດໃຊ້ການພິສູດຕົວຕົນສອງຊັ້ນ (Multi-Factor Authentication - MFA) ສຳລັບອີເມວ ແລະ ລະບົບພາຍໃນ HR Plus+.
1.2 ລະຫັດຜ່ານຕ້ອງມີຄວາມຍາວຢ່າງໜ້ອຍ 12 ຕົວອັກສອນ, ປະກອບມີຕົວອັກສອນໃຫຍ່, ຕົວນ້ອຍ, ຕົວເລກ ແລະ ສັນຍາລັກພິເສດ.

ຂໍ້ທີ 2: ການຈັດຊັ້ນຄວາມລັບຂອງຂໍ້ມູນ (Data Classification)
2.1 ຂໍ້ມູນຂອງ LHSE ແບ່ງອອກເປັນ 3 ລະດັບ:
   - ລະດັບ 1: ຂໍ້ມູນເປີດເຜີຍທົ່ວໄປ (Public)
   - ລະດັບ 2: ຂໍ້ມູນພາຍໃນອົງກອນ (Internal Confidential)
   - ລະດັບ 3: ຂໍ້ມູນລັບຂັ້ນສູງແຫ່ງລັດ (Strictly Secret - Concession Contracts & Equity Shares)

ຂໍ້ທີ 3: ການນຳໃຊ້ອຸປະກອນ ແລະ ສື່ບັນທຶກຂໍ້ມູນ (Device Usage & USB Media)
3.1 ຫ້າມສຽບ USB Flash Drive ຫຼື External Hard Drive ທີ່ບໍ່ໄດ້ຮັບອະນຸຍາດເຂົ້າຄອມພິວເຕີຫ້ອງການ.
3.2 ຄອມພິວເຕີໂນດບຸກຂອງ LHSE ທຸກເຄື່ອງຕ້ອງຕິດຕັ້ງລະບົບເຂົ້າລະຫັດ BitLocker / FileVault ເຕັມຮູບແບບ.`,
    versions: [
      {
        id: 'ver-004-2',
        documentId: 'doc-004',
        version: 'v2.2',
        title: 'Enterprise Information Security & Data Protection Directive',
        titleLao: 'ຄຳສັ່ງແນະນຳຄວາມປອດໄພຂໍ້ມູນຂ່າວສານ ແລະ ປົກປ້ອງຂໍ້ມູນອົງກອນ',
        content: `ຄຳສັ່ງແນະນຳຄວາມປອດໄພຂໍ້ມູນຂ່າວສານ (LHSE CYBERSECURITY & DATA DIRECTIVE)

ຂໍ້ທີ 1: ການພິສູດຕົວຕົນ ແລະ ລະຫັດຜ່ານ (Authentication & Password Standards)
1.1 ພະນັກງານທຸກຄົນຕ້ອງເປີດໃຊ້ການພິສູດຕົວຕົນສອງຊັ້ນ (Multi-Factor Authentication - MFA) ສຳລັບອີເມວ ແລະ ລະບົບພາຍໃນ HR Plus+.
1.2 ລະຫັດຜ່ານຕ້ອງມີຄວາມຍາວຢ່າງໜ້ອຍ 12 ຕົວອັກສອນ, ປະກອບມີຕົວອັກສອນໃຫຍ່, ຕົວນ້ອຍ, ຕົວເລກ ແລະ ສັນຍາລັກພິເສດ.

ຂໍ້ທີ 2: ການຈັດຊັ້ນຄວາມລັບຂອງຂໍ້ມູນ (Data Classification)
2.1 ຂໍ້ມູນຂອງ LHSE ແບ່ງອອກເປັນ 3 ລະດັບ:
   - ລະດັບ 1: ຂໍ້ມູນເປີດເຜີຍທົ່ວໄປ (Public)
   - ລະດັບ 2: ຂໍ້ມູນພາຍໃນອົງກອນ (Internal Confidential)
   - ລະດັບ 3: ຂໍ້ມູນລັບຂັ້ນສູງແຫ່ງລັດ (Strictly Secret - Concession Contracts & Equity Shares)

ຂໍ້ທີ 3: ການນຳໃຊ້ອຸປະກອນ ແລະ ສື່ບັນທຶກຂໍ້ມູນ (Device Usage & USB Media)
3.1 ຫ້າມສຽບ USB Flash Drive ຫຼື External Hard Drive ທີ່ບໍ່ໄດ້ຮັບອະນຸຍາດເຂົ້າຄອມພິວເຕີຫ້ອງການ.
3.2 ຄອມພິວເຕີໂນດບຸກຂອງ LHSE ທຸກເຄື່ອງຕ້ອງຕິດຕັ້ງລະບົບເຂົ້າລະຫັດ BitLocker / FileVault ເຕັມຮູບແບບ.`,
        changeSummary: 'Enforced Section 3.1 USB Flash storage ban and updated minimum password length from 8 to 12 characters.',
        changeType: 'PATCH',
        changedBy: 'Souliyo Phanthavong',
        changedByRole: 'IT Systems Administrator',
        changedAt: '2026-10-15T09:00:00Z',
        fileSize: '41.3 KB',
        status: 'ACTIVE',
      },
      {
        id: 'ver-004-1',
        documentId: 'doc-004',
        version: 'v2.0',
        title: 'LHSE IT Security Policy Baseline',
        titleLao: 'ນະໂຍບາຍຄວາມປອດໄພໄອທີ LHSE ສະບັບ 2.0',
        content: `ນະໂຍບາຍຄວາມປອດໄພໄອທີ LHSE (VERSION 2.0)
1. ພະນັກງານຕ້ອງໃຊ້ລະຫັດຜ່ານຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ.
2. ເປີດໃຊ້ MFA ສຳລັບອີເມວ.
3. ແບ່ງຊັ້ນຄວາມລັບຂໍ້ມູນເປັນ 3 ລະດັບ.`,
        changeSummary: 'Upgraded baseline with 3-tier data classification standard.',
        changeType: 'MAJOR',
        changedBy: 'Souliyo Phanthavong',
        changedByRole: 'IT Systems Administrator',
        changedAt: '2026-01-20T13:00:00Z',
        fileSize: '30.1 KB',
        status: 'SUPERSEDED',
      },
    ],
  },
  {
    id: 'doc-005',
    docNumber: 'LHSE-DOC-2026-005',
    title: 'Annual Corporate Income Tax & Statutory LSSO Declaration Guideline',
    titleLao: 'ຄຳແນະນຳການຍື່ນພາສີອາກອນລາຍໄດ້ວິສາຫະກິດ ແລະ ປະກັນສັງຄົມ (LSSO)',
    category: 'FINANCIAL',
    description: 'Mandatory fiscal filing guidelines for state-owned asset holding revenues, progressive wage bracket withholding, and BCEL statutory remittance certificates.',
    descriptionLao: 'ຄຳແນະນຳການຍື່ນເສຍອາກອນລາຍໄດ້ວິສາຫະກິດ, ການຫັກອາກອນເງິນເດືອນ ແລະ ການນຳສົ່ງເງິນປະກັນສັງຄົມ ຕາມກົດໝາຍສ່ວຍສາອາກອນ ແຫ່ງ ສປປ ລາວ.',
    departmentId: 'd-3', // Finance & Accounting
    currentVersion: 'v1.1',
    fileType: 'PDF',
    fileSize: '38.6 KB',
    status: 'ACTIVE',
    lastModifiedAt: '2026-10-12T15:20:00Z',
    lastModifiedBy: 'Sengdao Souvannavong',
    lastModifiedByRole: 'Finance & Accounting Director',
    tags: ['Tax', 'Confidential', 'Statutory', 'Finance'],
    content: `ຄຳແນະນຳການຍື່ນພາສີອາກອນ ແລະ ປະກັນສັງຄົມ (ANNUAL CORPORATE TAX & STATUTORY LSSO DIRECTIVE)

ມາດຕາ 1: ຫຼັກການເສຍອາກອນລາຍໄດ້ (Corporate & Personal Income Tax)
1.1 LHSE ປະຕິບັດຕາມກົດໝາຍວ່າດ້ວຍສ່ວຍສາອາກອນ ສະບັບປັບປຸງ ຢ່າງເຂັ້ມງວດ.
1.2 ອາກອນເງິນເດືອນ (Personal Income Tax - PIT) ຖືກຄິດໄລ່ຕາມອັດຕາຂັ້ນໄດ 0% ຫາ 25% ຈາກຖານເງິນເດືອນສຸດທິ ຫຼັງຫັກປະກັນສັງຄົມ.

ມາດຕາ 2: ການປະກອບສ່ວນປະກັນສັງຄົມ (LSSO Contribution)
2.1 ອັດຕາເງິນສົມທົບ 5.5% ຂອງລູກຈ້າງ (ສູງສຸດບໍ່ເກີນເພດານ 4,500,000 ກີບ) ແລະ 6.0% ຂອງຜູ້ວ່າຈ້າງ.
2.2 ຕ້ອງນຳສົ່ງບົດສະຫຼຸບ ແລະ ໂອນເງິນເຂົ້າບັນຊີອົງການປະກັນສັງຄົມແຫ່ງຊາດ ພາຍໃນວັນທີ 15 ຂອງເດືອນຖັດໄປ.`,
    versions: [
      {
        id: 'ver-005-2',
        documentId: 'doc-005',
        version: 'v1.1',
        title: 'Annual Corporate Income Tax & Statutory LSSO Declaration Guideline',
        titleLao: 'ຄຳແນະນຳການຍື່ນພາສີອາກອນລາຍໄດ້ວິສາຫະກິດ ແລະ ປະກັນສັງຄົມ (LSSO)',
        content: `ຄຳແນະນຳການຍື່ນພາສີອາກອນ ແລະ ປະກັນສັງຄົມ (ANNUAL CORPORATE TAX & STATUTORY LSSO DIRECTIVE)

ມາດຕາ 1: ຫຼັກການເສຍອາກອນລາຍໄດ້ (Corporate & Personal Income Tax)
1.1 LHSE ປະຕິບັດຕາມກົດໝາຍວ່າດ້ວຍສ່ວຍສາອາກອນ ສະບັບປັບປຸງ ຢ່າງເຂັ້ມງວດ.
1.2 ອາກອນເງິນເດືອນ (Personal Income Tax - PIT) ຖືກຄິດໄລ່ຕາມອັດຕາຂັ້ນໄດ 0% ຫາ 25% ຈາກຖານເງິນເດືອນສຸດທິ ຫຼັງຫັກປະກັນສັງຄົມ.

ມາດຕາ 2: ການປະກອບສ່ວນປະກັນສັງຄົມ (LSSO Contribution)
2.1 ອັດຕາເງິນສົມທົບ 5.5% ຂອງລູກຈ້າງ (ສູງສຸດບໍ່ເກີນເພດານ 4,500,000 ກີບ) ແລະ 6.0% ຂອງຜູ້ວ່າຈ້າງ.
2.2 ຕ້ອງນຳສົ່ງບົດສະຫຼຸບ ແລະ ໂອນເງິນເຂົ້າບັນຊີອົງການປະກັນສັງຄົມແຫ່ງຊາດ ພາຍໃນວັນທີ 15 ຂອງເດືອນຖັດໄປ.`,
        changeSummary: 'Updated statutory filing deadline to 15th of the month and refreshed tax ceiling guidelines.',
        changeType: 'MINOR',
        changedBy: 'Sengdao Souvannavong',
        changedByRole: 'Finance & Accounting Director',
        changedAt: '2026-10-12T15:20:00Z',
        fileSize: '38.6 KB',
        status: 'ACTIVE',
      },
      {
        id: 'ver-005-1',
        documentId: 'doc-005',
        version: 'v1.0',
        title: 'Initial Tax Filing Protocol',
        titleLao: 'ລະບຽບການຍື່ນອາກອນເບື້ອງຕົ້ນ',
        content: `ລະບຽບການຍື່ນອາກອນ (VERSION 1.0)
1. ຫັກອາກອນເງິນເດືອນພະນັກງານຕາມລະບຽບ.
2. ນຳສົ່ງປະກັນສັງຄົມ.`,
        changeSummary: 'Initial tax filing protocol baseline.',
        changeType: 'MAJOR',
        changedBy: 'Sengdao Souvannavong',
        changedByRole: 'Finance & Accounting Director',
        changedAt: '2025-05-10T10:00:00Z',
        fileSize: '21.5 KB',
        status: 'SUPERSEDED',
      },
    ],
  },
  {
    id: 'doc-006',
    docNumber: 'LHSE-SCAN-2026-088',
    title: 'Physical Contract: Bounleuth Luangrath (Managing Director & CEO)',
    titleLao: 'ບົດສັນຍາຈ້າງງານສະບັບຈິງ: ທ່ານ ບຸນເລີດ ຫລວງລາດ (ຜູ້ອຳນວຍການໃຫຍ່)',
    category: 'CONTRACT',
    description: 'Physical hardcopy contract scanned with LHSE Document Scanner, complete with official Red Seal stamp and executive counter-signatures.',
    descriptionLao: 'ບົດສັນຍາຈ້າງງານສະບັບເຈ້ຍຕົວຈິງທີ່ສະແກນຜ່ານກ້ອງຖ່າຍ LHSE Smart Scanner ພ້ອມກາແດງປະທັບ ແລະ ລາຍເຊັນຄົບຖ້ວນ.',
    departmentId: 'd-2', // HR & Admin
    currentVersion: 'v1.0',
    fileType: 'PDF',
    fileSize: '412 KB',
    status: 'ACTIVE',
    lastModifiedAt: '2026-10-24T09:15:00Z',
    lastModifiedBy: 'Soukavanh Vongvichit',
    lastModifiedByRole: 'HR & Admin Director',
    tags: ['Employee Contract', 'Confidential', 'Physical Scan', 'Verified Seal'],
    isScanned: true,
    scannedImageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" fill="none"><rect width="600" height="850" fill="%23fdfbf7"/><rect x="30" y="30" width="540" height="790" fill="none" stroke="%23cbd5e1" stroke-width="1.5"/><rect x="36" y="36" width="528" height="778" fill="none" stroke="%2394a3b8" stroke-dasharray="4 4" stroke-width="0.8"/><text x="300" y="80" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b">ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ</text><text x="300" y="102" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23475569">ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ</text><line x1="220" y1="115" x2="380" y2="115" stroke="%23dc2626" stroke-width="1.5"/><text x="300" y="150" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a">ບົດສັນຍາຈ້າງງານບໍລິຫານ (EXECUTIVE EMPLOYMENT CONTRACT)</text><text x="300" y="172" text-anchor="middle" font-family="sans-serif" font-size="11" fill="%2364748b">ເລກທີ: 088/ລຖລ.2026 | LAO HOLDING STATE ENTERPRISE</text><rect x="60" y="200" width="480" height="75" fill="%23f1f5f9" rx="6"/><text x="80" y="225" font-family="sans-serif" font-size="12" font-weight="bold" fill="%231e293b">ຜູ້ວ່າຈ້າງ (EMPLOYER): ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)</text><text x="80" y="245" font-family="sans-serif" font-size="11" fill="%23475569">ຜູ້ຕາງໜ້າ: ກະຊວງການເງິນ ແລະ ສະພາບໍລິຫານ LHSE</text><text x="80" y="263" font-family="sans-serif" font-size="11" fill="%23475569">ລູກຈ້າງ (EMPLOYEE): ທ່ານ ບຸນເລີດ ຫລວງລາດ (MD &amp; CEO)</text><text x="60" y="310" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 1: ຕຳແໜ່ງ ແລະ ຄວາມຮັບຜິດຊອບ (Article 1: Scope &amp; Office)</text><text x="60" y="330" font-family="sans-serif" font-size="10" fill="%23334155">1.1 ຜູ້ວ່າຈ້າງຕົກລົງແຕ່ງຕັ້ງລູກຈ້າງດຳລົງຕຳແໜ່ງ: ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)</text><text x="60" y="350" font-family="sans-serif" font-size="10" fill="%23334155">1.2 ບໍລິຫານຄຸ້ມຄອງການລົງທຶນໂຄງການໄຟຟ້າພະລັງນ້ຳ ແລະ ພະລັງງານສະອາດທົ່ວປະເທດ</text><text x="60" y="385" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 2: ເວລາເຮັດວຽກ ແລະ ສະຖານທີ່ (Article 2: Working Terms)</text><text x="60" y="405" font-family="sans-serif" font-size="10" fill="%23334155">2.1 ປະຕິບັດວຽກງານເຕັມເວລາ ທີ່ສຳນັກງານໃຫຍ່ LHSE, ນະຄອນຫຼວງວຽງຈັນ</text><text x="60" y="440" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 3: ເງິນເດືອນ ແລະ ເງິນອຸດໜູນ (Article 3: Remuneration)</text><text x="60" y="460" font-family="sans-serif" font-size="10" fill="%23334155">3.1 ເງິນເດືອນພື້ນຖານລັດວິສາຫະກິດ ຕາມລະບົບຂັ້ນເງິນເດືອນບໍລິຫານຊັ້ນສູງ</text><text x="60" y="480" font-family="sans-serif" font-size="10" fill="%23334155">3.2 ປະກອບສ່ວນເຂົ້າກອງທຶນປະກັນສັງຄົມແຫ່ງຊາດ (LSSO) ຕາມລະບຽບກົດໝາຍ</text><line x1="60" y1="520" x2="540" y2="520" stroke="%23e2e8f0" stroke-width="1"/><circle cx="480" cy="720" r="48" fill="%23ef4444" fill-opacity="0.12" stroke="%23dc2626" stroke-width="2.5" stroke-dasharray="4 2"/><circle cx="480" cy="720" r="38" fill="none" stroke="%23dc2626" stroke-width="1.2"/><text x="480" y="715" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="%23b91c1c">ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ</text><text x="480" y="730" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="%23b91c1c">LHSE OFFICIAL SEAL</text><text x="60" y="760" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">✓ Physical Digitized via LHSE Smart Camera Scanner</text><text x="60" y="776" font-family="sans-serif" font-size="9" fill="%2364748b">Verified by: Soukavanh Vongvichit (HR Director) | Security Hash: LHSE-SHA256-8801</text></svg>',
    scannedPages: [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" fill="none"><rect width="600" height="850" fill="%23fdfbf7"/><rect x="30" y="30" width="540" height="790" fill="none" stroke="%23cbd5e1" stroke-width="1.5"/><rect x="36" y="36" width="528" height="778" fill="none" stroke="%2394a3b8" stroke-dasharray="4 4" stroke-width="0.8"/><text x="300" y="80" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b">ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ</text><text x="300" y="102" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23475569">ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ</text><line x1="220" y1="115" x2="380" y2="115" stroke="%23dc2626" stroke-width="1.5"/><text x="300" y="150" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a">ບົດສັນຍາຈ້າງງານບໍລິຫານ (EXECUTIVE EMPLOYMENT CONTRACT)</text><text x="300" y="172" text-anchor="middle" font-family="sans-serif" font-size="11" fill="%2364748b">ເລກທີ: 088/ລຖລ.2026 | LAO HOLDING STATE ENTERPRISE</text><rect x="60" y="200" width="480" height="75" fill="%23f1f5f9" rx="6"/><text x="80" y="225" font-family="sans-serif" font-size="12" font-weight="bold" fill="%231e293b">ຜູ້ວ່າຈ້າງ (EMPLOYER): ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)</text><text x="80" y="245" font-family="sans-serif" font-size="11" fill="%23475569">ຜູ້ຕາງໜ້າ: ກະຊວງການເງິນ ແລະ ສະພາບໍລິຫານ LHSE</text><text x="80" y="263" font-family="sans-serif" font-size="11" fill="%23475569">ລູກຈ້າງ (EMPLOYEE): ທ່ານ ບຸນເລີດ ຫລວງລາດ (MD &amp; CEO)</text><text x="60" y="310" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 1: ຕຳແໜ່ງ ແລະ ຄວາມຮັບຜິດຊອບ (Article 1: Scope &amp; Office)</text><text x="60" y="330" font-family="sans-serif" font-size="10" fill="%23334155">1.1 ຜູ້ວ່າຈ້າງຕົກລົງແຕ່ງຕັ້ງລູກຈ້າງດຳລົງຕຳແໜ່ງ: ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)</text><text x="60" y="350" font-family="sans-serif" font-size="10" fill="%23334155">1.2 ບໍລິຫານຄຸ້ມຄອງການລົງທຶນໂຄງການໄຟຟ້າພະລັງນ້ຳ ແລະ ພະລັງງານສະອາດທົ່ວປະເທດ</text><text x="60" y="385" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 2: ເວລາເຮັດວຽກ ແລະ ສະຖານທີ່ (Article 2: Working Terms)</text><text x="60" y="405" font-family="sans-serif" font-size="10" fill="%23334155">2.1 ປະຕິບັດວຽກງານເຕັມເວລາ ທີ່ສຳນັກງານໃຫຍ່ LHSE, ນະຄອນຫຼວງວຽງຈັນ</text><text x="60" y="440" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 3: ເງິນເດືອນ ແລະ ເງິນອຸດໜູນ (Article 3: Remuneration)</text><text x="60" y="460" font-family="sans-serif" font-size="10" fill="%23334155">3.1 ເງິນເດືອນພື້ນຖານລັດວິສາຫະກິດ ຕາມລະບົບຂັ້ນເງິນເດືອນບໍລິຫານຊັ້ນສູງ</text><text x="60" y="480" font-family="sans-serif" font-size="10" fill="%23334155">3.2 ປະກອບສ່ວນເຂົ້າກອງທຶນປະກັນສັງຄົມແຫ່ງຊາດ (LSSO) ຕາມລະບຽບກົດໝາຍ</text><line x1="60" y1="520" x2="540" y2="520" stroke="%23e2e8f0" stroke-width="1"/><circle cx="480" cy="720" r="48" fill="%23ef4444" fill-opacity="0.12" stroke="%23dc2626" stroke-width="2.5" stroke-dasharray="4 2"/><circle cx="480" cy="720" r="38" fill="none" stroke="%23dc2626" stroke-width="1.2"/><text x="480" y="715" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="%23b91c1c">ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ</text><text x="480" y="730" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="%23b91c1c">LHSE OFFICIAL SEAL</text><text x="60" y="760" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">✓ Physical Digitized via LHSE Smart Camera Scanner</text><text x="60" y="776" font-family="sans-serif" font-size="9" fill="%2364748b">Verified by: Soukavanh Vongvichit (HR Director) | Security Hash: LHSE-SHA256-8801</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" fill="none"><rect width="600" height="850" fill="%23fdfbf7"/><rect x="30" y="30" width="540" height="790" fill="none" stroke="%23cbd5e1" stroke-width="1.5"/><text x="300" y="80" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b">ໜ້າທີ 2: ຂໍ້ຜູກພັນ ແລະ ລາຍເຊັນຄູ່ສັນຍາ (Page 2: Signatures)</text><line x1="180" y1="95" x2="420" y2="95" stroke="%23cbd5e1" stroke-width="1"/><text x="60" y="140" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 4: ການຮັກສາຄວາມລັບ (Article 4: Non-Disclosure)</text><text x="60" y="165" font-family="sans-serif" font-size="10" fill="%23334155">4.1 ຜູ້ຖືກແຕ່ງຕັ້ງຕ້ອງຮັກສາຄວາມລັບດ້ານການເງິນ ແລະ ຍຸດທະສາດການລົງທຶນຂອງ LHSE</text><rect x="60" y="220" width="220" height="150" fill="%23f8fafc" stroke="%23cbd5e1" rx="8"/><text x="170" y="250" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ຕາງໜ້າສະພາບໍລິຫານ LHSE</text><path d="M90 320 Q140 290 170 325 T240 310" stroke="%231e40af" stroke-width="2.5" fill="none"/><text x="170" y="345" text-anchor="middle" font-family="sans-serif" font-size="9" fill="%2364748b">(ປະທານສະພາບໍລິຫານ)</text><rect x="320" y="220" width="220" height="150" fill="%23f8fafc" stroke="%23cbd5e1" rx="8"/><text x="430" y="250" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ລາຍເຊັນລູກຈ້າງ (Employee)</text><path d="M350 320 Q400 295 440 320 T510 315" stroke="%230f172a" stroke-width="2.5" fill="none"/><text x="430" y="345" text-anchor="middle" font-family="sans-serif" font-size="9" fill="%2364748b">ທ່ານ ບຸນເລີດ ຫລວງລາດ</text><circle cx="480" cy="480" r="50" fill="%23ef4444" fill-opacity="0.15" stroke="%23dc2626" stroke-width="2.5"/><circle cx="480" cy="480" r="40" fill="none" stroke="%23dc2626" stroke-width="1.2"/><text x="480" y="475" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="%23b91c1c">ກະຊວງການເງິນ</text><text x="480" y="490" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="%23b91c1c">MINISTRY OF FINANCE</text></svg>'
    ],
    employeeId: 'emp-001',
    extractedMetadata: {
      employeeName: 'Bounleuth Luangrath (ທ່ານ ບຸນເລີດ ຫລວງລາດ)',
      employeeCode: 'LHSE-EMP-001',
      docClassification: 'EMPLOYEE_CONTRACT',
      officialStampDetected: true,
      ocrConfidence: 98.4,
    },
    content: `ບົດສັນຍາຈ້າງງານບໍລິຫານ (LHSE EXECUTIVE EMPLOYMENT CONTRACT)
[DIGITIZED VIA CAMERA SCANNER - 2 PAGES ATTACHED]

ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
---------------------------------------------
ເລກທີ: 088/ລຖລ.2026 | LAO HOLDING STATE ENTERPRISE (LHSE)

ຜູ້ວ່າຈ້າງ: ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)
ຕາງໜ້າ: ກະຊວງການເງິນ ແລະ ສະພາບໍລິຫານ LHSE
ລູກຈ້າງ: ທ່ານ ບຸນເລີດ ຫລວງລາດ (MD & CEO)

ມາດຕາ 1: ຕຳແໜ່ງ ແລະ ຄວາມຮັບຜິດຊອບ
1.1 ຜູ້ວ່າຈ້າງຕົກລົງແຕ່ງຕັ້ງລູກຈ້າງດຳລົງຕຳແໜ່ງ: ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)
1.2 ບໍລິຫານຄຸ້ມຄອງການລົງທຶນໂຄງການໄຟຟ້າພະລັງນ້ຳ ແລະ ພະລັງງານສະອາດທົ່ວປະເທດ

ມາດຕາ 2: ເວລາເຮັດວຽກ ແລະ ສະຖານທີ່
2.1 ປະຕິບັດວຽກງານເຕັມເວລາ ທີ່ສຳນັກງານໃຫຍ່ LHSE, ນະຄອນຫຼວງວຽງຈັນ

ມາດຕາ 3: ເງິນເດືອນ ແລະ ເງິນອຸດໜູນ
3.1 ເງິນເດືອນພື້ນຖານລັດວິສາຫະກິດ ຕາມລະບົບຂັ້ນເງິນເດືອນບໍລິຫານຊັ້ນສູງ
3.2 ປະກອບສ່ວນເຂົ້າກອງທຶນປະກັນສັງຄົມແຫ່ງຊາດ (LSSO) ຕາມລະບຽບກົດໝາຍ

[ກາແດງປະທັບຮັບຮອງ / OFFICIAL RED SEAL: VERIFIED LHSE & MOF]`,
    versions: [
      {
        id: 'ver-006-1',
        documentId: 'doc-006',
        version: 'v1.0',
        title: 'Physical Contract: Bounleuth Luangrath (Managing Director & CEO)',
        titleLao: 'ບົດສັນຍາຈ້າງງານສະບັບຈິງ: ທ່ານ ບຸນເລີດ ຫລວງລາດ (ຜູ້ອຳນວຍການໃຫຍ່)',
        content: `ບົດສັນຍາຈ້າງງານບໍລິຫານ (LHSE EXECUTIVE EMPLOYMENT CONTRACT)
[DIGITIZED VIA CAMERA SCANNER - 2 PAGES ATTACHED]

ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
---------------------------------------------
ເລກທີ: 088/ລຖລ.2026 | LAO HOLDING STATE ENTERPRISE (LHSE)

ຜູ້ວ່າຈ້າງ: ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)
ຕາງໜ້າ: ກະຊວງການເງິນ ແລະ ສະພາບໍລິຫານ LHSE
ລູກຈ້າງ: ທ່ານ ບຸນເລີດ ຫລວງລາດ (MD & CEO)

ມາດຕາ 1: ຕຳແໜ່ງ ແລະ ຄວາມຮັບຜິດຊອບ
1.1 ຜູ້ວ່າຈ້າງຕົກລົງແຕ່ງຕັ້ງລູກຈ້າງດຳລົງຕຳແໜ່ງ: ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)
1.2 ບໍລິຫານຄຸ້ມຄອງການລົງທຶນໂຄງການໄຟຟ້າພະລັງນ້ຳ ແລະ ພະລັງງານສະອາດທົ່ວປະເທດ

[ກາແດງປະທັບຮັບຮອງ / OFFICIAL RED SEAL: VERIFIED LHSE & MOF]`,
        changeSummary: 'Digitized from physical ink contract using LHSE Smart Camera Scanner. 2 pages captured with verified official seal.',
        changeType: 'MAJOR',
        changedBy: 'Soukavanh Vongvichit',
        changedByRole: 'HR & Admin Director',
        changedAt: '2026-10-24T09:15:00Z',
        fileSize: '412 KB',
        status: 'ACTIVE',
        isScanned: true,
        scannedImageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" fill="none"><rect width="600" height="850" fill="%23fdfbf7"/><rect x="30" y="30" width="540" height="790" fill="none" stroke="%23cbd5e1" stroke-width="1.5"/><rect x="36" y="36" width="528" height="778" fill="none" stroke="%2394a3b8" stroke-dasharray="4 4" stroke-width="0.8"/><text x="300" y="80" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b">ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ</text><text x="300" y="102" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23475569">ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ</text><line x1="220" y1="115" x2="380" y2="115" stroke="%23dc2626" stroke-width="1.5"/><text x="300" y="150" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a">ບົດສັນຍາຈ້າງງານບໍລິຫານ (EXECUTIVE EMPLOYMENT CONTRACT)</text><text x="300" y="172" text-anchor="middle" font-family="sans-serif" font-size="11" fill="%2364748b">ເລກທີ: 088/ລຖລ.2026 | LAO HOLDING STATE ENTERPRISE</text><rect x="60" y="200" width="480" height="75" fill="%23f1f5f9" rx="6"/><text x="80" y="225" font-family="sans-serif" font-size="12" font-weight="bold" fill="%231e293b">ຜູ້ວ່າຈ້າງ (EMPLOYER): ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)</text><text x="80" y="245" font-family="sans-serif" font-size="11" fill="%23475569">ຜູ້ຕາງໜ້າ: ກະຊວງການເງິນ ແລະ ສະພາບໍລິຫານ LHSE</text><text x="80" y="263" font-family="sans-serif" font-size="11" fill="%23475569">ລູກຈ້າງ (EMPLOYEE): ທ່ານ ບຸນເລີດ ຫລວງລາດ (MD &amp; CEO)</text><text x="60" y="310" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 1: ຕຳແໜ່ງ ແລະ ຄວາມຮັບຜິດຊອບ (Article 1: Scope &amp; Office)</text><text x="60" y="330" font-family="sans-serif" font-size="10" fill="%23334155">1.1 ຜູ້ວ່າຈ້າງຕົກລົງແຕ່ງຕັ້ງລູກຈ້າງດຳລົງຕຳແໜ່ງ: ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)</text><text x="60" y="350" font-family="sans-serif" font-size="10" fill="%23334155">1.2 ບໍລິຫານຄຸ້ມຄອງການລົງທຶນໂຄງການໄຟຟ້າພະລັງນ້ຳ ແລະ ພະລັງງານສະອາດທົ່ວປະເທດ</text><text x="60" y="385" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 2: ເວລາເຮັດວຽກ ແລະ ສະຖານທີ່ (Article 2: Working Terms)</text><text x="60" y="405" font-family="sans-serif" font-size="10" fill="%23334155">2.1 ປະຕິບັດວຽກງານເຕັມເວລາ ທີ່ສຳນັກງານໃຫຍ່ LHSE, ນະຄອນຫຼວງວຽງຈັນ</text><text x="60" y="440" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 3: ເງິນເດືອນ ແລະ ເງິນອຸດໜູນ (Article 3: Remuneration)</text><text x="60" y="460" font-family="sans-serif" font-size="10" fill="%23334155">3.1 ເງິນເດືອນພື້ນຖານລັດວິສາຫະກິດ ຕາມລະບົບຂັ້ນເງິນເດືອນບໍລິຫານຊັ້ນສູງ</text><text x="60" y="480" font-family="sans-serif" font-size="10" fill="%23334155">3.2 ປະກອບສ່ວນເຂົ້າກອງທຶນປະກັນສັງຄົມແຫ່ງຊາດ (LSSO) ຕາມລະບຽບກົດໝາຍ</text><line x1="60" y1="520" x2="540" y2="520" stroke="%23e2e8f0" stroke-width="1"/><circle cx="480" cy="720" r="48" fill="%23ef4444" fill-opacity="0.12" stroke="%23dc2626" stroke-width="2.5" stroke-dasharray="4 2"/><circle cx="480" cy="720" r="38" fill="none" stroke="%23dc2626" stroke-width="1.2"/><text x="480" y="715" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="%23b91c1c">ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ</text><text x="480" y="730" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="%23b91c1c">LHSE OFFICIAL SEAL</text><text x="60" y="760" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">✓ Physical Digitized via LHSE Smart Camera Scanner</text><text x="60" y="776" font-family="sans-serif" font-size="9" fill="%2364748b">Verified by: Soukavanh Vongvichit (HR Director) | Security Hash: LHSE-SHA256-8801</text></svg>',
        scannedPages: [
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" fill="none"><rect width="600" height="850" fill="%23fdfbf7"/><rect x="30" y="30" width="540" height="790" fill="none" stroke="%23cbd5e1" stroke-width="1.5"/><rect x="36" y="36" width="528" height="778" fill="none" stroke="%2394a3b8" stroke-dasharray="4 4" stroke-width="0.8"/><text x="300" y="80" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b">ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ</text><text x="300" y="102" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23475569">ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ</text><line x1="220" y1="115" x2="380" y2="115" stroke="%23dc2626" stroke-width="1.5"/><text x="300" y="150" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a">ບົດສັນຍາຈ້າງງານບໍລິຫານ (EXECUTIVE EMPLOYMENT CONTRACT)</text><text x="300" y="172" text-anchor="middle" font-family="sans-serif" font-size="11" fill="%2364748b">ເລກທີ: 088/ລຖລ.2026 | LAO HOLDING STATE ENTERPRISE</text><rect x="60" y="200" width="480" height="75" fill="%23f1f5f9" rx="6"/><text x="80" y="225" font-family="sans-serif" font-size="12" font-weight="bold" fill="%231e293b">ຜູ້ວ່າຈ້າງ (EMPLOYER): ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)</text><text x="80" y="245" font-family="sans-serif" font-size="11" fill="%23475569">ຜູ້ຕາງໜ້າ: ກະຊວງການເງິນ ແລະ ສະພາບໍລິຫານ LHSE</text><text x="80" y="263" font-family="sans-serif" font-size="11" fill="%23475569">ລູກຈ້າງ (EMPLOYEE): ທ່ານ ບຸນເລີດ ຫລວງລາດ (MD &amp; CEO)</text><text x="60" y="310" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 1: ຕຳແໜ່ງ ແລະ ຄວາມຮັບຜິດຊອບ (Article 1: Scope &amp; Office)</text><text x="60" y="330" font-family="sans-serif" font-size="10" fill="%23334155">1.1 ຜູ້ວ່າຈ້າງຕົກລົງແຕ່ງຕັ້ງລູກຈ້າງດຳລົງຕຳແໜ່ງ: ຜູ້ອຳນວຍການໃຫຍ່ (Managing Director)</text><text x="60" y="350" font-family="sans-serif" font-size="10" fill="%23334155">1.2 ບໍລິຫານຄຸ້ມຄອງການລົງທຶນໂຄງການໄຟຟ້າພະລັງນ້ຳ ແລະ ພະລັງງານສະອາດທົ່ວປະເທດ</text><text x="60" y="385" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 2: ເວລາເຮັດວຽກ ແລະ ສະຖານທີ່ (Article 2: Working Terms)</text><text x="60" y="405" font-family="sans-serif" font-size="10" fill="%23334155">2.1 ປະຕິບັດວຽກງານເຕັມເວລາ ທີ່ສຳນັກງານໃຫຍ່ LHSE, ນະຄອນຫຼວງວຽງຈັນ</text><text x="60" y="440" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 3: ເງິນເດືອນ ແລະ ເງິນອຸດໜູນ (Article 3: Remuneration)</text><text x="60" y="460" font-family="sans-serif" font-size="10" fill="%23334155">3.1 ເງິນເດືອນພື້ນຖານລັດວິສາຫະກິດ ຕາມລະບົບຂັ້ນເງິນເດືອນບໍລິຫານຊັ້ນສູງ</text><text x="60" y="480" font-family="sans-serif" font-size="10" fill="%23334155">3.2 ປະກອບສ່ວນເຂົ້າກອງທຶນປະກັນສັງຄົມແຫ່ງຊາດ (LSSO) ຕາມລະບຽບກົດໝາຍ</text><line x1="60" y1="520" x2="540" y2="520" stroke="%23e2e8f0" stroke-width="1"/><circle cx="480" cy="720" r="48" fill="%23ef4444" fill-opacity="0.12" stroke="%23dc2626" stroke-width="2.5" stroke-dasharray="4 2"/><circle cx="480" cy="720" r="38" fill="none" stroke="%23dc2626" stroke-width="1.2"/><text x="480" y="715" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="%23b91c1c">ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ</text><text x="480" y="730" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="%23b91c1c">LHSE OFFICIAL SEAL</text><text x="60" y="760" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23059669">✓ Physical Digitized via LHSE Smart Camera Scanner</text><text x="60" y="776" font-family="sans-serif" font-size="9" fill="%2364748b">Verified by: Soukavanh Vongvichit (HR Director) | Security Hash: LHSE-SHA256-8801</text></svg>',
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" fill="none"><rect width="600" height="850" fill="%23fdfbf7"/><rect x="30" y="30" width="540" height="790" fill="none" stroke="%23cbd5e1" stroke-width="1.5"/><text x="300" y="80" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b">ໜ້າທີ 2: ຂໍ້ຜູກພັນ ແລະ ລາຍເຊັນຄູ່ສັນຍາ (Page 2: Signatures)</text><line x1="180" y1="95" x2="420" y2="95" stroke="%23cbd5e1" stroke-width="1"/><text x="60" y="140" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ມາດຕາ 4: ການຮັກສາຄວາມລັບ (Article 4: Non-Disclosure)</text><text x="60" y="165" font-family="sans-serif" font-size="10" fill="%23334155">4.1 ຜູ້ຖືກແຕ່ງຕັ້ງຕ້ອງຮັກສາຄວາມລັບດ້ານການເງິນ ແລະ ຍຸດທະສາດການລົງທຶນຂອງ LHSE</text><rect x="60" y="220" width="220" height="150" fill="%23f8fafc" stroke="%23cbd5e1" rx="8"/><text x="170" y="250" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ຕາງໜ້າສະພາບໍລິຫານ LHSE</text><path d="M90 320 Q140 290 170 325 T240 310" stroke="%231e40af" stroke-width="2.5" fill="none"/><text x="170" y="345" text-anchor="middle" font-family="sans-serif" font-size="9" fill="%2364748b">(ປະທານສະພາບໍລິຫານ)</text><rect x="320" y="220" width="220" height="150" fill="%23f8fafc" stroke="%23cbd5e1" rx="8"/><text x="430" y="250" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231e293b">ລາຍເຊັນລູກຈ້າງ (Employee)</text><path d="M350 320 Q400 295 440 320 T510 315" stroke="%230f172a" stroke-width="2.5" fill="none"/><text x="430" y="345" text-anchor="middle" font-family="sans-serif" font-size="9" fill="%2364748b">ທ່ານ ບຸນເລີດ ຫລວງລາດ</text><circle cx="480" cy="480" r="50" fill="%23ef4444" fill-opacity="0.15" stroke="%23dc2626" stroke-width="2.5"/><circle cx="480" cy="480" r="40" fill="none" stroke="%23dc2626" stroke-width="1.2"/><text x="480" y="475" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="%23b91c1c">ກະຊວງການເງິນ</text><text x="480" y="490" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="%23b91c1c">MINISTRY OF FINANCE</text></svg>'
        ],
      },
    ],
  },
];

export const SUGGESTED_DOCUMENT_TAGS = [
  'Confidential',
  'Tax',
  'Employee Contract',
  'Hydropower',
  'Audit',
  'Labor Law',
  'Legal',
  'Governance',
  'Finance',
  'Statutory',
  'Policy',
  'State Enterprise',
];

export interface TagStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export function getTagColorClass(tag: string): TagStyle {
  const normalized = tag.toLowerCase().trim();
  if (normalized.includes('confidential') || normalized.includes('secret')) {
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-900/60',
      dot: 'bg-rose-500',
    };
  }
  if (normalized.includes('tax') || normalized.includes('finance') || normalized.includes('revenue')) {
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-900/60',
      dot: 'bg-emerald-500',
    };
  }
  if (normalized.includes('contract') || normalized.includes('employment')) {
    return {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-900/60',
      dot: 'bg-blue-500',
    };
  }
  if (normalized.includes('hydro') || normalized.includes('energy') || normalized.includes('concession')) {
    return {
      bg: 'bg-cyan-50 dark:bg-cyan-950/50',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-200 dark:border-cyan-900/60',
      dot: 'bg-cyan-500',
    };
  }
  if (normalized.includes('audit') || normalized.includes('urgent') || normalized.includes('warning')) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-900/60',
      dot: 'bg-amber-500',
    };
  }
  if (normalized.includes('legal') || normalized.includes('governance') || normalized.includes('statutory')) {
    return {
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-900/60',
      dot: 'bg-purple-500',
    };
  }
  if (normalized.includes('it') || normalized.includes('security') || normalized.includes('cyber')) {
    return {
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-900/60',
      dot: 'bg-indigo-500',
    };
  }
  return {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  };
}

/**
 * Calculates next version tag based on bump type
 */
export function calculateNextVersion(currentVersion: string, bumpType: VersionChangeType): string {
  // Extract numbers from "v1.2" or "v2.0.1"
  const clean = currentVersion.replace(/^v/i, '');
  const parts = clean.split('.').map((p) => parseInt(p, 10) || 0);

  let major = parts[0] || 1;
  let minor = parts.length > 1 ? parts[1] : 0;
  let patch = parts.length > 2 ? parts[2] : 0;

  if (bumpType === 'MAJOR') {
    major += 1;
    minor = 0;
    patch = 0;
    return `v${major}.0`;
  } else if (bumpType === 'MINOR') {
    minor += 1;
    patch = 0;
    return `v${major}.${minor}`;
  } else if (bumpType === 'PATCH') {
    if (parts.length > 2) {
      patch += 1;
      return `v${major}.${minor}.${patch}`;
    } else {
      // e.g. v2.1 -> v2.1.1
      return `v${major}.${minor}.1`;
    }
  } else if (bumpType === 'RESTORE') {
    // When restoring, we generate e.g. v2.2 (Restored)
    minor += 1;
    return `v${major}.${minor}`;
  }

  return `v${major}.${minor + 1}`;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  lineNumOld?: number;
  lineNumNew?: number;
}

/**
 * Computes simple, robust line-by-line diff for comparing two document versions
 */
export function computeLineDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const result: DiffLine[] = [];

  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length) {
      if (oldLines[oldIdx] === newLines[newIdx]) {
        result.push({
          type: 'unchanged',
          text: oldLines[oldIdx],
          lineNumOld: oldIdx + 1,
          lineNumNew: newIdx + 1,
        });
        oldIdx++;
        newIdx++;
      } else {
        // Look ahead to see if old line appears later in new
        const foundInNew = newLines.slice(newIdx, newIdx + 5).indexOf(oldLines[oldIdx]);
        // Look ahead to see if new line appears later in old
        const foundInOld = oldLines.slice(oldIdx, oldIdx + 5).indexOf(newLines[newIdx]);

        if (foundInNew !== -1 && (foundInOld === -1 || foundInNew <= foundInOld)) {
          // Lines were added in new
          result.push({
            type: 'added',
            text: newLines[newIdx],
            lineNumNew: newIdx + 1,
          });
          newIdx++;
        } else if (foundInOld !== -1) {
          // Lines were removed from old
          result.push({
            type: 'removed',
            text: oldLines[oldIdx],
            lineNumOld: oldIdx + 1,
          });
          oldIdx++;
        } else {
          // Modification: mark old as removed, new as added
          result.push({
            type: 'removed',
            text: oldLines[oldIdx],
            lineNumOld: oldIdx + 1,
          });
          result.push({
            type: 'added',
            text: newLines[newIdx],
            lineNumNew: newIdx + 1,
          });
          oldIdx++;
          newIdx++;
        }
      }
    } else if (oldIdx < oldLines.length) {
      result.push({
        type: 'removed',
        text: oldLines[oldIdx],
        lineNumOld: oldIdx + 1,
      });
      oldIdx++;
    } else if (newIdx < newLines.length) {
      result.push({
        type: 'added',
        text: newLines[newIdx],
        lineNumNew: newIdx + 1,
      });
      newIdx++;
    }
  }

  return result;
}
