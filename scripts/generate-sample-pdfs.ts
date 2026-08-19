import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const outputDir = path.join(process.cwd(), 'data', 'judgments');

const sampleCases = [
  {
    filename: 'Sharma_v_Meridian_Textiles_2023.pdf',
    title: 'Rajesh Kumar Sharma v. Meridian Textiles Private Limited (2023)',
    court: 'Supreme Court of India',
    year: 2023,
    text: `IN THE SUPREME COURT OF INDIA
CRIMINAL APPELLATE JURISDICTION
CRIMINAL APPEAL NO. 402 OF 2023
RAJESH KUMAR SHARMA ... APPELLANT
VERSUS
MERIDIAN TEXTILES PRIVATE LIMITED AND ANR. ... RESPONDENTS

JUDGMENT / RATIO DECIDENDI:
1. This appeal arises out of proceedings under Section 138 of the Negotiable Instruments Act 1881 for dishonour of Cheque No. 408122 for Rs. 45,000,000 due to insufficient funds.
2. Core legal issue: Whether a company director who authorized the cheque remains personally liable under Section 138 notwithstanding subsequent corporate restructuring.
3. Key facts: Appellant supplied raw cotton to Respondent company. Cheque returned with endorsement 'Funds Insufficient'. High Court quashed proceedings against managing director.
4. HELD: Appeal allowed. Under Section 141 of Negotiable Instruments Act, every person in charge of company affairs is vicariously liable. Respondent company and managing director held jointly and severally liable with 12% interest per annum.`,
  },
  {
    filename: 'Devi_v_State_2021.pdf',
    title: 'Sunita Devi v. State of Uttar Pradesh (2021)',
    court: 'Supreme Court of India',
    year: 2021,
    text: `IN THE SUPREME COURT OF INDIA
CRIMINAL APPELLATE JURISDICTION
CRIMINAL APPEAL NO. 118 OF 2021
SUNITA DEVI ... APPELLANT
VERSUS
STATE OF UTTAR PRADESH AND ANR. ... RESPONDENTS

JUDGMENT / RATIO DECIDENDI:
1. Criminal appeal challenging acquittal under Section 498A IPC and Sections 3/4 Dowry Prohibition Act 1961.
2. Core legal issue: Standard of proof required to establish cruelty by husband and in-laws in matrimonial disputes.
3. Key facts: Marriage solemnized in 2015. Allegations of demand for dowry and harassment leading to physical abuse and separation.
4. HELD: High Court erred in ignoring medical injury reports and consistent testimony. Acquittal set aside. Remanded for fresh consideration adhering to statutory evidentiary standards.`,
  },
  {
    filename: 'Nair_v_Union_2022.pdf',
    title: 'Ramesh Nair v. Union of India (2022)',
    court: 'Supreme Court of India',
    year: 2022,
    text: `IN THE SUPREME COURT OF INDIA
CIVIL APPELLATE JURISDICTION
CIVIL APPEAL NO. 3050 OF 2022
RAMESH NAIR ... APPELLANT
VERSUS
UNION OF INDIA AND ORS. ... RESPONDENTS

JUDGMENT / RATIO DECIDENDI:
1. Civil appeal regarding entitlement to disability pension under Armed Forces Pension Regulations 1961.
2. Core legal issue: Whether medical condition attributable to or aggravated by military service during high-altitude deployment.
3. Key facts: Appellant served 18 years in Indian Army. Invalided out due to hypertension. Armed Forces Tribunal denied disability pension.
4. HELD: Appeal allowed. In absence of medical record at time of enlistment, disability presumed attributable to service conditions. Full disability pension granted with back wages.`,
  },
];

async function generateSamplePDFs() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clean existing old PDFs in data/judgments
  const existingFiles = fs.readdirSync(outputDir);
  for (const file of existingFiles) {
    fs.unlinkSync(path.join(outputDir, file));
  }

  for (const item of sampleCases) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595, 842]); // A4
    const { height } = page.getSize();

    page.drawText(item.title, {
      x: 50,
      y: height - 60,
      size: 14,
      font: boldFont,
      color: rgb(0.06, 0.09, 0.16),
    });

    page.drawText(`Court: ${item.court} | Year: ${item.year}`, {
      x: 50,
      y: height - 85,
      size: 10,
      font: boldFont,
      color: rgb(0.7, 0.4, 0.1),
    });

    const lines = item.text.split('\n');
    let yPos = height - 120;

    for (const line of lines) {
      if (yPos < 50) break;
      const isHeader = line.includes('JUDGMENT') || line.includes('COURT') || line.includes('VERSUS');
      page.drawText(line, {
        x: 50,
        y: yPos,
        size: isHeader ? 10 : 9,
        font: isHeader ? boldFont : font,
        color: rgb(0.1, 0.15, 0.25),
      });
      yPos -= 16;
    }

    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(outputDir, item.filename);
    fs.writeFileSync(filePath, pdfBytes);
    console.log(`[Generated Judgment PDF]: ${filePath}`);
  }
}

generateSamplePDFs().catch(console.error);
