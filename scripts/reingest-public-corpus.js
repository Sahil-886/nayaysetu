const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(process.cwd(), 'data', 'public_corpus');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Clean old public corpus files if re-ingesting
const files = fs.readdirSync(outputDir);
for (const f of files) {
  if (f.endsWith('.pdf')) {
    fs.unlinkSync(path.join(outputDir, f));
  }
}

const publicStatutes = [
  {
    filename: 'Constitution_Fundamental_Rights.pdf',
    title: 'Constitution of India - Fundamental Rights (Part III)',
    category: 'Constitutional Rights',
    statute: 'Constitution of India 1950',
    sections: ['Article 14', 'Article 19', 'Article 21', 'Article 21A', 'Article 22', 'Article 32'],
    paragraphs: [
      'CONSTITUTION OF INDIA - PART III: FUNDAMENTAL RIGHTS',
      '',
      'ARTICLE 14: EQUALITY BEFORE LAW',
      'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.',
      '',
      'ARTICLE 19: PROTECTION OF CERTAIN RIGHTS REGARDING FREEDOM OF SPEECH & OCCUPATION',
      'All citizens shall have the right to freedom of speech and expression, to assemble peaceably, to form associations, to move freely throughout India, and to practice any profession, trade, or business.',
      '',
      'ARTICLE 21: PROTECTION OF LIFE AND PERSONAL LIBERTY',
      'No person shall be deprived of his life or personal liberty except according to procedure established by law. Article 21 includes the right to live with human dignity, right to shelter, right to livelihood, and right to clean environment.',
      '',
      'ARTICLE 21A: RIGHT TO EDUCATION',
      'The State shall provide free and compulsory education to all children of the age of six to fourteen years.',
      '',
      'ARTICLE 22: PROTECTION AGAINST ARREST AND DETENTION',
      'No person arrested shall be detained in custody without being informed of the grounds of arrest, nor shall he be denied the right to consult and be defended by a legal practitioner of his choice. Every person arrested must be produced before the nearest magistrate within 24 hours.',
      '',
      'ARTICLE 32: RIGHT TO CONSTITUTIONAL REMEDIES',
      'The right to move the Supreme Court by appropriate proceedings for the enforcement of Fundamental Rights is guaranteed. Supreme Court has power to issue writs including Habeas Corpus, Mandamus, Prohibition, Quo Warranto, and Certiorari.',
    ],
  },
  {
    filename: 'Tenant_Eviction_Rights.pdf',
    title: 'Tenant Rights & Protection against Illegal Eviction',
    category: 'Tenancy & Housing',
    statute: 'Transfer of Property Act 1882 & Rent Control Acts',
    sections: ['Section 106 TPA', 'Section 108 TPA', 'State Rent Control Acts'],
    paragraphs: [
      'TENANCY LAWS & TENANT PROTECTION IN INDIA',
      '',
      '1. PROTECTION AGAINST ARBITRARY OR ILLEGAL EVICTION:',
      'A landlord CANNOT forcibly evict a tenant, lock them out, cut electricity or water supply, or remove their belongings without following due process of law. Mandatory written notice of eviction must be given (minimum 15 days for monthly tenancy under Section 106 Transfer of Property Act 1882).',
      '',
      '2. RENT CONTROL PROTECTION:',
      'Under state Rent Control Acts, eviction is permitted ONLY on specific statutory grounds such as non-payment of rent for consecutive months, willful damage to property, sub-letting without consent, or bona fide personal necessity of landlord.',
      '',
      '3. SECURITY DEPOSIT REFUND:',
      'Landlords are legally obligated to refund the security deposit upon termination of tenancy after deducting valid repair costs for damages beyond normal wear and tear.',
      '',
      '4. LEGAL REMEDIES FOR TENANTS:',
      'If landlord attempts illegal lockout or harassment, the tenant can file an emergency petition before the Rent Controller / Civil Court for injunctive relief and restoration of essential services (water/electricity), or register a police complaint for criminal trespass and intimidation.',
    ],
  },
  {
    filename: 'Labor_Wages_Protection.pdf',
    title: 'Employee Salary & Wages Protection Rights',
    category: 'Employment & Labor',
    statute: 'Payment of Wages Act 1936 & Industrial Disputes Act 1947',
    sections: ['Section 15 Payment of Wages Act', 'Section 33C Industrial Disputes Act'],
    paragraphs: [
      'EMPLOYEE WAGE PROTECTION & UNPAID SALARY REMEDIES',
      '',
      '1. MANDATORY TIMELY PAYMENT OF SALARY:',
      'Under the Payment of Wages Act 1936, wages must be paid before the 7th or 10th day of the following month. Employers cannot withhold salary or make unauthorized wage deductions without valid statutory reasons.',
      '',
      '2. REMEDIES FOR UNPAID SALARY & DUES:',
      'If an employer fails or refuses to pay salary, the employee has multiple statutory remedies:',
      '- Issue a formal Legal Demand Notice giving 15 days to clear pending dues.',
      '- File a claim before the Labor Commissioner under Section 15 of Payment of Wages Act for recovery of wages plus compensation up to 10 times the amount.',
      '- Approach the Labor Court under Section 33C of Industrial Disputes Act 1947 for recovery of money due from employer.',
      '- File a complaint before the National Company Law Tribunal (NCLT) under Insolvency and Bankruptcy Code (IBC) if operational debt exceeds statutory threshold.',
      '',
      '3. WRONGFUL TERMINATION & NOTICE PERIOD:',
      'Employers must provide contractual notice period or salary in lieu of notice before termination, along with encashment of earned leaves and gratuity if eligible.',
    ],
  },
  {
    filename: 'Consumer_Protection_Rights.pdf',
    title: 'Consumer Protection Rights & Defective Product Remedies',
    category: 'Consumer Rights',
    statute: 'Consumer Protection Act 2019',
    sections: ['Section 2(7)', 'Section 2(11)', 'Section 35 CPA 2019'],
    paragraphs: [
      'CONSUMER PROTECTION ACT 2019 - CITIZEN RIGHTS',
      '',
      '1. CORE CONSUMER RIGHTS (SECTION 2(7)):',
      'Every consumer purchasing goods or hiring services (online or offline) has the right to be protected against unfair trade practices, defective products, deficient services, misleading advertisements, and overcharging above Maximum Retail Price (MRP).',
      '',
      '2. DEFICIENCY OF SERVICE & PRODUCT LIABILITY:',
      'A seller, manufacturer, or service provider is liable for replacement of defective product, full refund of purchase price, and compensation for mental agony or financial loss caused by deficiency of service.',
      '',
      '3. HOW TO FILE A CONSUMER COMPLAINT:',
      '- Step 1: Call National Consumer Helpline (NCH) at 1915 or register online on INGRAM portal (consumerhelpline.gov.in).',
      '- Step 2: Send written notice to manufacturer/seller requesting refund or replacement within 15 days.',
      '- Step 3: File a formal complaint online via e-daakhil portal (edaakhil.nic.in) before District Consumer Disputes Redressal Commission (District Forum) for claims up to Rs. 50 Lakhs.',
      'No advocate is mandatory in Consumer Commission; citizens can present their own case.',
    ],
  },
  {
    filename: 'Domestic_Violence_Protection.pdf',
    title: 'Protection of Women from Domestic Violence Rights',
    category: 'Women Protection & Safety',
    statute: 'Protection of Women from Domestic Violence Act 2005 (PWDVA)',
    sections: ['Section 3', 'Section 12', 'Section 18', 'Section 19 PWDVA'],
    paragraphs: [
      'PROTECTION OF WOMEN FROM DOMESTIC VIOLENCE ACT 2005',
      '',
      '1. DEFINITION OF DOMESTIC VIOLENCE (SECTION 3):',
      'Domestic violence includes physical abuse, sexual abuse, verbal/emotional abuse, and economic abuse (denial of financial resources, maintenance, or shared household) committed by a spouse or relatives in a shared household.',
      '',
      '2. IMMEDIATE RELIEF ORDERS AVAILABLE UNDER PWDVA:',
      '- Protection Orders (Section 18): Prohibiting perpetrator from committing violence or contacting victim.',
      '- Residence Orders (Section 19): Restraining perpetrator from evicting victim from shared household.',
      '- Monetary Relief (Section 20): Monthly maintenance for living expenses, medical bills, and child support.',
      '- Custody Orders (Section 21): Temporary custody of minor children.',
      '',
      '3. EMERGENCY HELPLINES & LEGAL ASSISTANCE:',
      '- Emergency Women Helpline: Dial 181 (24/7 toll-free helpline).',
      '- Approach Protection Officer appointed by State Government in every district.',
      '- Contact District Legal Services Authority (DLSA) for free legal representation.',
    ],
  },
  {
    filename: 'Right_to_Information_RTI.pdf',
    title: 'Right to Information (RTI) Application & Procedure',
    category: 'Governance & Transparency',
    statute: 'Right to Information Act 2005',
    sections: ['Section 3', 'Section 6', 'Section 7', 'Section 19 RTI Act'],
    paragraphs: [
      'RIGHT TO INFORMATION ACT 2005 - CITIZEN GUIDE',
      '',
      '1. CITIZEN RIGHT TO KNOW (SECTION 3):',
      'Any Indian citizen can request information from any public authority (government departments, public sector units, police, municipal corporations, universities).',
      '',
      '2. HOW TO SUBMIT RTI APPLICATION (SECTION 6):',
      '- Write simple application in English, Hindi, or official local language addressed to Public Information Officer (PIO).',
      '- Specify exact information requested clearly.',
      '- Pay nominal fee of Rs. 10 (via Court Fee stamp, IPO, Demand Draft, or online at rtionline.gov.in for Central Government). BPL cardholders are exempt from fees.',
      '',
      '3. MANDATORY TIME LIMITS FOR RESPONSE (SECTION 7):',
      '- Normal Information: PIO must provide information within 30 days of receiving application.',
      '- Life or Liberty Information: Information concerning life or liberty must be provided within 48 hours.',
      '',
      '4. APPEALS PROCESS (SECTION 19):',
      '- First Appeal: If no response in 30 days or unsatisfactory answer, file First Appeal within 30 days to First Appellate Authority (FAA).',
      '- Second Appeal: File Second Appeal to State / Central Information Commission.',
    ],
  },
  {
    filename: 'FIR_Criminal_Police_Rights.pdf',
    title: 'FIR Registration, Police Station & Arrest Rights',
    category: 'Criminal Law & Police Powers',
    statute: 'Bharatiya Nagarik Suraksha Sanhita 2023 (BNSS) / CrPC & NALSA Act',
    sections: ['Section 173 BNSS (Zero FIR)', 'Section 35 BNSS (Arrest Rights)', 'Section 12 NALSA Act'],
    paragraphs: [
      'CITIZEN RIGHTS IN POLICE INVESTIGATION & ARREST',
      '',
      '1. MANDATORY FIR REGISTRATION & ZERO FIR:',
      'If a cognizable offense (e.g. theft, assault, robbery, fraud) is reported, the police station IS LEGALLY BOUND to register a First Information Report (FIR). If offense occurred outside station jurisdiction, police must register a "Zero FIR" and transfer it to the concerned police station.',
      '',
      '2. RIGHTS OF AN ARRESTED PERSON:',
      '- Right to know grounds of arrest immediately.',
      '- Right to inform a family member or friend about arrest instantly.',
      '- Right to consult and be represented by a lawyer of choice.',
      '- Right to medical examination by a government medical officer upon arrest.',
      '- Right to be produced before Magistrate within 24 hours of arrest.',
      '- Women cannot be arrested after sunset and before sunrise except in extraordinary circumstances with prior written permission of Judicial Magistrate.',
      '',
      '3. FREE LEGAL AID UNDER NALSA (SECTION 12 NALSA ACT):',
      'Free legal assistance is guaranteed to women, children, SC/ST members, industrial workmen, persons in custody, and individuals with low annual income through National Legal Services Authority (NALSA Helpline: 15100).',
    ],
  }
];

async function generateEmbed(text) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  try {
    const res = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text', prompt: text }),
    });
    const data = await res.json();
    if (data.embedding && Array.isArray(data.embedding)) return data.embedding;
  } catch (e) {
    console.warn('[Public Ingest Embedding Warning]:', e.message);
  }
  return new Array(768).fill(0.01);
}

async function main() {
  console.log('----------------------------------------------------');
  console.log('📢 NyaySetu: Public Legal Rights Corpus Ingestion');
  console.log('----------------------------------------------------');

  for (const item of publicStatutes) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595, 842]);
    const { height } = page.getSize();

    page.drawText(item.title, { x: 40, y: height - 50, size: 12, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
    page.drawText(`Statute: ${item.statute} | Category: ${item.category}`, { x: 40, y: height - 70, size: 9, font: boldFont, color: rgb(0.6, 0.4, 0.1) });

    let y = height - 100;
    for (const para of item.paragraphs) {
      if (!para) { y -= 8; continue; }
      const isBold = para.includes('SECTION') || para.includes('ARTICLE') || para.includes('RIGHTS') || para.includes('1.') || para.includes('2.') || para.includes('3.') || para.includes('4.');
      page.drawText(para.slice(0, 95), { x: 40, y, size: 9, font: isBold ? boldFont : font, color: rgb(0.15, 0.15, 0.15) });
      y -= 14;
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    const filePath = path.join(outputDir, item.filename);
    fs.writeFileSync(filePath, Buffer.from(pdfBytes));
    console.log(`[Generated Public PDF]: ${filePath}`);
  }

  const documents = [];
  const publicChunks = [];

  for (const item of publicStatutes) {
    const text = item.paragraphs.join('\n');
    const docId = `pub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    documents.push({
      id: docId,
      title: item.title,
      category: item.category,
      statute: item.statute,
      sections: item.sections,
      source_file: item.filename,
    });

    console.log(`\n📄 Vectorizing Public Rights Statute: ${item.filename}`);
    console.log(`   Title: ${item.title}`);
    console.log(`   Statute: ${item.statute}`);

    const embedding = await generateEmbed(text);

    publicChunks.push({
      id: `chunk-${docId}-1`,
      doc_id: docId,
      title: item.title,
      category: item.category,
      statute: item.statute,
      sections: item.sections,
      source_file: item.filename,
      content: text,
      chunk_index: 1,
      embedding,
    });
  }

  const indexPath = path.join(process.cwd(), 'data', 'public-index.json');
  fs.writeFileSync(indexPath, JSON.stringify({ documents, publicChunks }, null, 2));

  console.log('\n----------------------------------------------------');
  console.log('🎉 Public Legal Corpus Ingested Successfully!');
  console.log(`📁 Saved public vector corpus index to ${indexPath}`);
  console.log('----------------------------------------------------');
}

main().catch(console.error);
