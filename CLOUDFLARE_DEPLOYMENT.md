# 🚀 ຄູ່ມືການ Deploy ລະບົບ HR Plus+ LHSE ຂຶ້ນ Cloudflare
# Cloudflare Pages & Workers Deployment Guide

ຄູ່ມືນີ້ອະທິບາຍຂັ້ນຕອນການຕິດຕັ້ງ ແລະ Deploy ລະບົບ **HR Plus+ Lao Holding State Enterprise (LHSE)** ຂຶ້ນສູ່ **Cloudflare Pages / Workers Global Edge Network** ຢ່າງລະອຽດ.

---

## 📋 ພາບລວມສະຖາປັດຕະຍະກຳ (Architecture Overview)

ລະບົບຖືກອອກແບບມາໃຫ້ຮອງຮັບ Cloudflare Edge 100%:
1. **Frontend**: React 19 + TypeScript + Tailwind CSS (Vite Build) ສົ່ງອອກໄປຍັງໂຟນເດີ `./dist`.
2. **SPA Client Routing**: ມີໄຟລ໌ `public/_redirects` (`/* /index.html 200`) ປ້ອງກັນບັນຫາ 404 Not Found ເວລາ Refresh ໜ້າຕ່າງໆ.
3. **Security & Headers**: ມີໄຟລ໌ `public/_headers` ກຳນົດ Content-Security-Policy, X-Frame-Options, ແລະ Permissions-Policy (ອະນຸຍາດໃຫ້ໃຊ້ Camera ສໍາລັບລະບົບ Document Scanner).
4. **Edge Serverless APIs**: ໂຟນເດີ `functions/api/` ຮອງຮັບ Cloudflare Pages Functions ເຊັ່ນ:
   - `/api/health`: ກວດສອບສະຖານະລະບົບ ແລະ Edge Location
   - `/api/audit-logs`: ບັນທຶກ ແລະ ດຶງຂໍ້ມູນ Audit Trail ເທິງ Edge Memory
5. **Wrangler Configuration**: ໄຟລ໌ `wrangler.jsonc` ຕັ້ງຄ່າ Project Name, Compatibility Flags, ແລະ Static Asset binding.

---

## 🛠️ ວິທີທີ 1: Deploy ຜ່ານ Wrangler CLI (ແນະນຳ - ໄວທີ່ສຸດ)

### 1.1 ກວດສອບ ຫຼື ສ້າງ Build ໃໝ່
```bash
npm run build
```

### 1.2 ເຂົ້າສູ່ລະບົບ Cloudflare (ຖ້າຍັງບໍ່ທັນ Login)
```bash
npx wrangler login
```
*(ລະບົບຈະເປີດ Browser ໃຫ້ທ່ານກົດອະນຸຍາດເຂົ້າສູ່ລະບົບ Cloudflare)*

ຫຼື ຖ້າທ່ານມີ **Cloudflare API Token**:
```bash
export CLOUDFLARE_API_TOKEN="your-api-token-here"
export CLOUDFLARE_ACCOUNT_ID="cafe3d79fc7d8796843b960a8b29e5ae"
```

### 1.3 Deploy ຂຶ້ນ Cloudflare Pages
ທ່ານສາມາດກົດ Run script ທີ່ຕຽມໄວ້ໃນ `package.json` ໄດ້ທັນທີ:
```bash
npm run deploy:pages
```
ຫຼື ໃຊ້ຄຳສັ່ງ Wrangler ໂດຍກົງ:
```bash
npx wrangler pages deploy dist --project-name=lhse-hr-plus
```

ເມື່ອ deploy ສໍາເລັດ, Wrangler ຈະສົ່ງ Link ເວັບໄຊທ໌ຂອງທ່ານ ເຊັ່ນ:
👉 `https://lhse-hr-plus.pages.dev`

---

## 🌐 ວິທີທີ 2: Deploy ຜ່ານ Cloudflare Dashboard (Git Integration)

ຖ້າທ່ານເກັບ Code ໄວ້ໃນ **GitHub** ຫຼື **GitLab**:

1. ເຂົ້າໄປທີ່ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. ເລືອກເມນູ **Workers & Pages** > ກົດປຸ່ມ **Create application**
3. ເລືອກແຖບ **Pages** > ກົດ **Connect to Git**
4. ເລືອກ Repository ຂອງລະບົບ `HR Plus+ LHSE`
5. ຕັ້ງຄ່າ Build Settings ດັ່ງນີ້:
   - **Framework preset**: `Vite` (ຫຼື `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Node.js version**: `20` ຫຼື ສູງກວ່າ (ສາມາດຕັ້ງຄ່າ Environment variable `NODE_VERSION=20`)
6. ກົດ **Save and Deploy**!
7. Cloudflare ຈະເຮັດ CI/CD Auto-deploy ທຸກໆຄັ້ງທີ່ທ່ານ `git push` ຂຶ້ນ GitHub.

---

## 📦 ວິທີທີ 3: Direct Upload (Drag & Drop ໂຟນເດີ dist)

ຖ້າບໍ່ຕ້ອງການໃຊ້ CLI ຫຼື Git:

1. ສ້າງ Build ໄຟລ໌:
   ```bash
   npm run build
   ```
2. ເຂົ້າສູ່ລະບົບ [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. ໄປທີ່ **Workers & Pages** > ກົດ **Create application** > ເລືອກແທັບ **Pages**
4. ເລືອກ **Upload assets**
5. ໃສ່ Project name ເຊັ່ນ: `lhse-hr-plus`
6. ລາກໂຟນເດີ `dist` ທັງໝົດມາວາງລົງໃນໜ້າຕ່າງ ຫຼື ເລືອກ Upload
7. ກົດ **Deploy site** — ເວັບໄຊທ໌ຈະ Online ທັນທີ!

---

## ⚙️ ການຕັ້ງຄ່າ Custom Domain (ເຊັ່ນ: hr.lhse.gov.la)

1. ພາຍຫຼັງ Deploy ສຳເລັດ, ເຂົ້າໄປທີ່ໜ້າ Project ໃນ Cloudflare Pages
2. ເລືອກແທັບ **Custom domains**
3. ກົດປຸ່ມ **Set up a custom domain**
4. ພິມຊື່ໂດເມນຂອງທ່ານ (ເຊັ່ນ: `hr.lhse.gov.la` ຫຼື `hrplus.lhse.com`)
5. Cloudflare ຈະຈັດການສ້າງ **SSL/TLS Certificate (HTTPS)** ແລະ DNS records ໃຫ້ໂດຍອັດຕະໂນມັດ ຟຣີ 100%!

---

## 🧪 ການທົດສອບພາຍຫຼັງ Deploy (Verification Checklist)

- [ ] ເປີດໜ້າທຳອິດ: ກວດສອບໜ້າ Login ແລະ Dashboard ໂຫຼດໄດ້ວ່ອງໄວ
- [ ] ກົດ Refresh ໃນໜ້າຕ່າງໆ (ເຊັ່ນ: `/employees`, `/documents`) ເພື່ອຢືນຢັນວ່າ `_redirects` ເຮັດວຽກປົກກະຕິ ບໍ່ຕິດ 404
- [ ] ທົດສອບກ້ອງຖ່າຍຮູບ: ເຂົ້າ Documents & Assets > ກົດ "Scan Document" ເພື່ອທົດສອບ Web Camera Stream
- [ ] ທົດສອບ Edge API: ເຂົ້າໄປທີ່ `https://your-domain.pages.dev/api/health` ຈະຕ້ອງໄດ້ຮັບ JSON ສະຖານະ `HEALTHY` ພ້ອມ Cloudflare Edge Ray ID.
