// components/DocumentTemplates.ts

export interface DocumentTemplate {
  id: string;
  name: string;
  content: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "divorce-petition",
    name: "Divorce Petition",
    content: `
      <style>
        .divorce-petition {
          font-family: Times, serif;
          line-height: 1.4;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        .divorce-petition .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .divorce-petition .case-info {
          border: 2px solid #000;
          padding: 15px;
          margin-bottom: 20px;
        }
        .divorce-petition .section {
          margin-bottom: 20px;
        }
        .divorce-petition .section-title {
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 10px;
        }
        .divorce-petition .indent {
          margin-left: 40px;
        }
        .divorce-petition .signature-section {
          margin-top: 40px;
          border-top: 1px solid #ccc;
          padding-top: 20px;
        }
        .divorce-petition .blank {
          border-bottom: 1px solid #000;
          display: inline-block;
          min-width: 200px;
          margin: 0 5px;
        }
        .divorce-petition .checkbox {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 1px solid #000;
          margin-right: 5px;
          vertical-align: middle;
        }
        .divorce-petition .footer {
          margin-top: 30px;
          font-size: 12px;
          text-align: center;
          color: #666;
        }
        .divorce-petition table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        .divorce-petition table tr {
          border-bottom: 1px solid #ccc;
        }
        .divorce-petition table tr:first-child {
          border-bottom: 1px solid #000;
        }
      </style>
      <div class="divorce-petition">
        <div class="header">
          <h2>IN THE DISTRICT COURT OF <span class="blank">[COUNTY NAME]</span> COUNTY</h2>
          <h2>STATE OF <span class="blank">[STATE NAME]</span></h2>
        </div>

        <div class="case-info">
          <table>
            <tr>
              <td width="60%">
                <strong><span class="blank">[PETITIONER FULL NAME]</span></strong><br>
                Petitioner
              </td>
              <td width="40%">
                Case No. <span class="blank">[CASE NUMBER]</span><br>
                Division <span class="blank">[DIVISION]</span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="text-align: center; padding: 10px 0;">
                <strong>vs.</strong>
              </td>
            </tr>
            <tr>
              <td width="60%">
                <strong><span class="blank">[RESPONDENT FULL NAME]</span></strong><br>
                Respondent
              </td>
              <td width="40%">
                <strong>PETITION FOR DISSOLUTION OF MARRIAGE</strong>
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">TO THE HONORABLE JUDGE OF SAID COURT:</div>
          <p>NOW COMES <span class="blank">[PETITIONER FULL NAME]</span>, Petitioner, and respectfully represents to this Honorable Court the following:</p>
        </div>

        <div class="section">
          <div class="section-title">I. JURISDICTION AND VENUE</div>
          <p><strong>1.1</strong> Petitioner has been a resident of the State of <span class="blank">[STATE]</span> for more than <span class="blank">[NUMBER]</span> months immediately preceding the filing of this petition.</p>
          <p><strong>1.2</strong> Venue is proper in this county because:</p>
          <div class="indent">
            <p><span class="checkbox"></span> Petitioner resides in this county</p>
            <p><span class="checkbox"></span> Respondent resides in this county</p>
            <p><span class="checkbox"></span> The parties last resided together as husband and wife in this county</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">II. MARRIAGE INFORMATION</div>
          <p><strong>2.1</strong> The parties were married on <span class="blank">[MARRIAGE DATE]</span> in <span class="blank">[CITY, STATE]</span>.</p>
          <p><strong>2.2</strong> The parties separated on <span class="blank">[SEPARATION DATE]</span> and have lived separate and apart since that date.</p>
          <p><strong>2.3</strong> This marriage is irretrievably broken with no reasonable prospect of reconciliation.</p>
        </div>

        <div class="section">
          <div class="section-title">III. CHILDREN</div>
          <p><span class="checkbox"></span> There are no minor children born or adopted during this marriage.</p>
          <p><span class="checkbox"></span> There are minor children of this marriage, specifically:</p>
          <div class="indent">
            <table>
              <tr>
                <td><strong>Child's Name</strong></td>
                <td><strong>Date of Birth</strong></td>
                <td><strong>Age</strong></td>
              </tr>
              <tr>
                <td><span class="blank">[CHILD 1 NAME]</span></td>
                <td><span class="blank">[DOB]</span></td>
                <td><span class="blank">[AGE]</span></td>
              </tr>
              <tr>
                <td><span class="blank">[CHILD 2 NAME]</span></td>
                <td><span class="blank">[DOB]</span></td>
                <td><span class="blank">[AGE]</span></td>
              </tr>
            </table>
          </div>
          <p><strong>3.1</strong> The best interests of the minor children would be served by:</p>
          <div class="indent">
            <p><span class="checkbox"></span> Joint custody to both parents</p>
            <p><span class="checkbox"></span> Sole custody to Petitioner</p>
            <p><span class="checkbox"></span> Sole custody to Respondent</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">IV. PROPERTY AND DEBTS</div>
          <p><strong>4.1</strong> The parties have acquired real and personal property during the marriage.</p>
          <p><strong>4.2</strong> The parties have incurred debts and obligations during the marriage.</p>
          <p><strong>4.3</strong> Petitioner requests that the Court divide the marital property and debts equitably between the parties.</p>
        </div>

        <div class="section">
          <div class="section-title">V. SPOUSAL SUPPORT</div>
          <p><span class="checkbox"></span> Neither party should be awarded spousal support.</p>
          <p><span class="checkbox"></span> Petitioner should be awarded spousal support.</p>
          <p><span class="checkbox"></span> Respondent should be awarded spousal support.</p>
          <p><span class="checkbox"></span> The Court should reserve jurisdiction to determine spousal support.</p>
        </div>

        <div class="section">
          <div class="section-title">VI. RESTORATION OF NAME</div>
          <p><span class="checkbox"></span> Petitioner does not request restoration of former name.</p>
          <p><span class="checkbox"></span> Petitioner requests restoration of former name: <span class="blank">[FORMER NAME]</span></p>
        </div>

        <div class="section">
          <div class="section-title">VII. PRAYER FOR RELIEF</div>
          <p>WHEREFORE, Petitioner respectfully prays that this Court:</p>
          <div class="indent">
            <p><strong>A.</strong> Grant a decree of dissolution of marriage;</p>
            <p><strong>B.</strong> Award custody of minor children as requested herein;</p>
            <p><strong>C.</strong> Establish a reasonable visitation schedule;</p>
            <p><strong>D.</strong> Order appropriate child support;</p>
            <p><strong>E.</strong> Divide marital property and debts equitably;</p>
            <p><strong>F.</strong> Award spousal support as appropriate;</p>
            <p><strong>G.</strong> Restore Petitioner's former name if requested;</p>
            <p><strong>H.</strong> Award costs and attorney's fees; and</p>
            <p><strong>I.</strong> Grant such other relief as the Court deems just and proper.</p>
          </div>
        </div>

        <div class="signature-section">
          <p>Respectfully submitted,</p>
          <br><br>
          <p>_________________________________<br>
          <span class="blank">[PETITIONER SIGNATURE]</span><br>
          Petitioner</p>
          
          <br>
          
          <p>_________________________________<br>
          <span class="blank">[ATTORNEY NAME]</span><br>
          Attorney for Petitioner<br>
          Bar No. <span class="blank">[BAR NUMBER]</span><br>
          <span class="blank">[LAW FIRM NAME]</span><br>
          <span class="blank">[ADDRESS]</span><br>
          <span class="blank">[CITY, STATE ZIP]</span><br>
          Phone: <span class="blank">[PHONE]</span><br>
          Email: <span class="blank">[EMAIL]</span></p>
        </div>

        <div class="footer">
          <p><strong>IMPORTANT NOTICE:</strong> This is a template document. Legal requirements vary by jurisdiction. 
          Consult with a qualified attorney before filing any legal documents. This template is for informational purposes only 
          and does not constitute legal advice.</p>
        </div>
      </div>
    `,
  },
  {
    id: "lease-agreement",
    name: "Lease Agreement",
    content: `
      <style>
        .lease-agreement {
          font-family: Arial, sans-serif;
          line-height: 1.5;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        .lease-agreement .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
        }
        .lease-agreement .parties-section {
          background: #f9f9f9;
          padding: 15px;
          border: 1px solid #ddd;
          margin-bottom: 20px;
        }
        .lease-agreement .section {
          margin-bottom: 25px;
        }
        .lease-agreement .section-title {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 10px;
          color: #333;
        }
        .lease-agreement .subsection {
          margin-left: 20px;
          margin-bottom: 15px;
        }
        .lease-agreement .blank {
          border-bottom: 1px solid #000;
          display: inline-block;
          min-width: 150px;
          margin: 0 3px;
          padding: 2px 5px;
        }
        .lease-agreement .signature-section {
          margin-top: 40px;
          border-top: 2px solid #000;
          padding-top: 20px;
        }
        .lease-agreement .signature-box {
          border: 1px solid #000;
          padding: 15px;
          margin: 10px 0;
          background: #fafafa;
        }
        .lease-agreement .terms-box {
          border: 1px solid #333;
          padding: 10px;
          margin: 10px 0;
          background: #f5f5f5;
        }
        .lease-agreement .important {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 10px;
          margin: 15px 0;
        }
      </style>
      <div class="lease-agreement">
        <div class="header">
          <h2>RESIDENTIAL LEASE AGREEMENT</h2>
          <p><strong>Fixed Term Tenancy</strong></p>
        </div>

        <div class="parties-section">
          <h3>PARTIES TO THIS AGREEMENT</h3>
          <p><strong>LANDLORD:</strong> <span class="blank">[LANDLORD FULL NAME]</span></p>
          <p><strong>ADDRESS:</strong> <span class="blank">[LANDLORD ADDRESS]</span></p>
          <p><strong>PHONE:</strong> <span class="blank">[LANDLORD PHONE]</span> <strong>EMAIL:</strong> <span class="blank">[LANDLORD EMAIL]</span></p>
          
          <p><strong>TENANT(S):</strong> <span class="blank">[TENANT 1 FULL NAME]</span></p>
          <p><span class="blank">[TENANT 2 FULL NAME]</span> (if applicable)</p>
          <p><strong>PHONE:</strong> <span class="blank">[TENANT PHONE]</span> <strong>EMAIL:</strong> <span class="blank">[TENANT EMAIL]</span></p>
        </div>

        <div class="section">
          <div class="section-title">1. RENTAL PROPERTY</div>
          <p>The Landlord agrees to rent to the Tenant(s) the following described property:</p>
          <div class="terms-box">
            <p><strong>Property Address:</strong> <span class="blank">[PROPERTY ADDRESS]</span></p>
            <p><strong>City:</strong> <span class="blank">[CITY]</span> <strong>State:</strong> <span class="blank">[STATE]</span> <strong>ZIP:</strong> <span class="blank">[ZIP CODE]</span></p>
            <p><strong>Type:</strong> <span class="blank">[APARTMENT/HOUSE/CONDO]</span></p>
            <p><strong>Bedrooms:</strong> <span class="blank">[NUMBER]</span> <strong>Bathrooms:</strong> <span class="blank">[NUMBER]</span></p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. LEASE TERM</div>
          <p><strong>Start Date:</strong> <span class="blank">[START DATE]</span></p>
          <p><strong>End Date:</strong> <span class="blank">[END DATE]</span></p>
          <p><strong>Total Lease Period:</strong> <span class="blank">[NUMBER]</span> months</p>
          <p>This lease will automatically terminate on the end date unless renewed by mutual agreement.</p>
        </div>

        <div class="section">
          <div class="section-title">3. RENT AND PAYMENT TERMS</div>
          <div class="subsection">
            <p><strong>Monthly Rent:</strong> $<span class="blank">[MONTHLY RENT AMOUNT]</span></p>
            <p><strong>Due Date:</strong> <span class="blank">[DAY OF MONTH]</span> of each month</p>
            <p><strong>Payment Method:</strong> <span class="blank">[CHECK/ONLINE/MONEY ORDER]</span></p>
            <p><strong>Late Fee:</strong> $<span class="blank">[LATE FEE AMOUNT]</span> if rent is more than <span class="blank">[NUMBER]</span> days late</p>
            <p><strong>Security Deposit:</strong> $<span class="blank">[SECURITY DEPOSIT AMOUNT]</span></p>
            <p><strong>First Month's Rent:</strong> $<span class="blank">[FIRST MONTH AMOUNT]</span></p>
            <p><strong>Last Month's Rent:</strong> $<span class="blank">[LAST MONTH AMOUNT]</span> (if applicable)</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">4. UTILITIES AND SERVICES</div>
          <p>The following utilities and services are included in the rent:</p>
          <div class="subsection">
            <p>☐ Water ☐ Sewer ☐ Electricity ☐ Gas ☐ Internet ☐ Cable TV</p>
            <p>☐ Trash Collection ☐ Landscaping ☐ Snow Removal ☐ Parking</p>
          </div>
          <p>Tenant is responsible for: <span class="blank">[LIST TENANT UTILITIES]</span></p>
        </div>

        <div class="section">
          <div class="section-title">5. OCCUPANCY</div>
          <p>The premises shall be occupied only by the named Tenant(s) and the following authorized occupants:</p>
          <p><span class="blank">[AUTHORIZED OCCUPANTS]</span></p>
          <p><strong>Maximum Occupancy:</strong> <span class="blank">[NUMBER]</span> persons</p>
        </div>

        <div class="section">
          <div class="section-title">6. PETS</div>
          <p>☐ No pets allowed</p>
          <p>☐ Pets allowed with the following conditions:</p>
          <div class="subsection">
            <p>Pet Type: <span class="blank">[DOG/CAT/OTHER]</span></p>
            <p>Pet Deposit: $<span class="blank">[PET DEPOSIT AMOUNT]</span></p>
            <p>Monthly Pet Fee: $<span class="blank">[MONTHLY PET FEE]</span></p>
            <p>Additional Conditions: <span class="blank">[PET CONDITIONS]</span></p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">7. MAINTENANCE AND REPAIRS</div>
          <p><strong>Landlord Responsibilities:</strong> Structural repairs, major appliances, heating/cooling systems, plumbing, electrical systems.</p>
          <p><strong>Tenant Responsibilities:</strong> Minor repairs under $<span class="blank">[AMOUNT]</span>, light bulbs, batteries, filters, general cleanliness.</p>
          <p><strong>Emergency Repairs:</strong> Contact <span class="blank">[EMERGENCY CONTACT]</span> at <span class="blank">[EMERGENCY PHONE]</span></p>
        </div>

        <div class="section">
          <div class="section-title">8. PROPERTY CONDITIONS AND INSPECTIONS</div>
          <p>Tenant acknowledges receiving the property in good condition. Landlord may inspect the property with <span class="blank">[NUMBER]</span> hours written notice, except in emergencies.</p>
        </div>

        <div class="section">
          <div class="section-title">9. PROHIBITED ACTIVITIES</div>
          <p>The following activities are prohibited:</p>
          <div class="subsection">
            <p>• Smoking ☐ Allowed ☐ Prohibited ☐ Designated areas only</p>
            <p>• Illegal activities of any kind</p>
            <p>• Disturbing neighbors or creating excessive noise</p>
            <p>• Subletting without written permission</p>
            <p>• Alterations to the property without written consent</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">10. LEASE TERMINATION</div>
          <p><strong>Early Termination Fee:</strong> $<span class="blank">[TERMINATION FEE]</span></p>
          <p><strong>Notice Required:</strong> <span class="blank">[NUMBER]</span> days written notice</p>
          <p>Security deposit will be returned within <span class="blank">[NUMBER]</span> days after move-out, less any deductions for damages or unpaid rent.</p>
        </div>

        <div class="important">
          <p><strong>IMPORTANT:</strong> This lease agreement is legally binding. Both parties should read and understand all terms before signing. State and local laws may apply.</p>
        </div>

        <div class="signature-section">
          <h3>SIGNATURES</h3>
          
          <div class="signature-box">
            <p><strong>LANDLORD</strong></p>
            <p>Signature: ___________________________________ Date: ___________</p>
            <p>Print Name: <span class="blank">[LANDLORD NAME]</span></p>
          </div>

          <div class="signature-box">
            <p><strong>TENANT</strong></p>
            <p>Signature: ___________________________________ Date: ___________</p>
            <p>Print Name: <span class="blank">[TENANT 1 NAME]</span></p>
          </div>

          <div class="signature-box">
            <p><strong>TENANT (if applicable)</strong></p>
            <p>Signature: ___________________________________ Date: ___________</p>
            <p>Print Name: <span class="blank">[TENANT 2 NAME]</span></p>
          </div>
        </div>

        <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
          <strong>DISCLAIMER:</strong> This template is for informational purposes only and does not constitute legal advice. 
          Consult with a qualified attorney or real estate professional before using this agreement.
        </p>
      </div>
    `,
  },
  {
    id: "last-will-testament",
    name: "Last Will and Testament",
    content: `
      <style>
        .will-testament {
          font-family: Times, serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        .will-testament .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px double #000;
          padding-bottom: 20px;
        }
        .will-testament .testator-info {
          background: #f8f9fa;
          border: 2px solid #000;
          padding: 20px;
          margin-bottom: 30px;
          text-align: center;
        }
        .will-testament .article {
          margin-bottom: 30px;
          border-left: 3px solid #333;
          padding-left: 15px;
        }
        .will-testament .article-title {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 15px;
          text-transform: uppercase;
          color: #333;
        }
        .will-testament .section {
          margin-bottom: 20px;
          margin-left: 20px;
        }
        .will-testament .section-title {
          font-weight: bold;
          margin-bottom: 10px;
          text-decoration: underline;
        }
        .will-testament .blank {
          border-bottom: 1px solid #000;
          display: inline-block;
          min-width: 200px;
          margin: 0 5px;
          padding: 2px 5px;
        }
        .will-testament .witness-section {
          margin-top: 50px;
          border: 2px solid #000;
          padding: 20px;
          background: #fafafa;
        }
        .will-testament .signature-section {
          margin-top: 40px;
          border-top: 2px solid #000;
          padding-top: 30px;
        }
        .will-testament .notary-section {
          margin-top: 30px;
          border: 2px solid #000;
          padding: 20px;
          background: #f0f8ff;
        }
        .will-testament .important-notice {
          background: #fff3cd;
          border: 2px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        .will-testament .beneficiary-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .will-testament .beneficiary-table th,
        .will-testament .beneficiary-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        .will-testament .beneficiary-table th {
          background: #f5f5f5;
          font-weight: bold;
        }
      </style>
      <div class="will-testament">
        <div class="header">
          <h1>LAST WILL AND TESTAMENT</h1>
          <h3>OF</h3>
          <h2><span class="blank">[TESTATOR FULL NAME]</span></h2>
        </div>

        <div class="testator-info">
          <p><strong>I, <span class="blank">[TESTATOR FULL NAME]</span>, a resident of <span class="blank">[CITY]</span>, <span class="blank">[STATE]</span>, being of sound mind and memory, do hereby make, publish, and declare this to be my Last Will and Testament, hereby revoking all former wills and codicils made by me.</strong></p>
        </div>

        <div class="important-notice">
          <p><strong>IMPORTANT:</strong> This document should be executed in accordance with state law requirements, typically requiring witnesses and/or notarization.</p>
        </div>

        <div class="article">
          <div class="article-title">Article I - Family Information</div>
          <div class="section">
            <p><strong>1.1 Marital Status:</strong></p>
            <p>☐ I am married to <span class="blank">[SPOUSE FULL NAME]</span></p>
            <p>☐ I am not married</p>
            <p>☐ I am divorced from <span class="blank">[FORMER SPOUSE NAME]</span></p>
            <p>☐ I am widowed, my deceased spouse was <span class="blank">[DECEASED SPOUSE NAME]</span></p>
          </div>
          <div class="section">
            <p><strong>1.2 Children:</strong></p>
            <p>☐ I have no children</p>
            <p>☐ I have the following children:</p>
            <table class="beneficiary-table">
              <tr>
                <th>Child's Full Name</th>
                <th>Date of Birth</th>
                <th>Relationship</th>
              </tr>
              <tr>
                <td><span class="blank">[CHILD 1 NAME]</span></td>
                <td><span class="blank">[DOB]</span></td>
                <td><span class="blank">[BIOLOGICAL/ADOPTED/STEP]</span></td>
              </tr>
              <tr>
                <td><span class="blank">[CHILD 2 NAME]</span></td>
                <td><span class="blank">[DOB]</span></td>
                <td><span class="blank">[BIOLOGICAL/ADOPTED/STEP]</span></td>
              </tr>
              <tr>
                <td><span class="blank">[CHILD 3 NAME]</span></td>
                <td><span class="blank">[DOB]</span></td>
                <td><span class="blank">[BIOLOGICAL/ADOPTED/STEP]</span></td>
              </tr>
            </table>
          </div>
        </div>

        <div class="article">
          <div class="article-title">Article II - Appointment of Personal Representative</div>
          <div class="section">
            <p><strong>2.1</strong> I nominate and appoint <span class="blank">[EXECUTOR FULL NAME]</span> of <span class="blank">[EXECUTOR ADDRESS]</span> as the Personal Representative (Executor) of this Will.</p>
            <p><strong>2.2</strong> If my first choice cannot serve, I nominate <span class="blank">[ALTERNATE EXECUTOR NAME]</span> of <span class="blank">[ALTERNATE EXECUTOR ADDRESS]</span> as alternate Personal Representative.</p>
            <p><strong>2.3</strong> I direct that no bond be required of any Personal Representative named herein.</p>
          </div>
        </div>

        <div class="article">
          <div class="article-title">Article III - Payment of Debts and Expenses</div>
          <div class="section">
            <p><strong>3.1</strong> I direct my Personal Representative to pay all my just debts, funeral expenses, and the expenses of administering my estate.</p>
            <p><strong>3.2</strong> I direct that all estate and inheritance taxes be paid from my residuary estate.</p>
          </div>
        </div>

        <div class="article">
          <div class="article-title">Article IV - Specific Bequests</div>
          <div class="section">
            <p><strong>4.1 Personal Property:</strong></p>
            <p>I give the following specific items to the named beneficiaries:</p>
            <table class="beneficiary-table">
              <tr>
                <th>Item Description</th>
                <th>Beneficiary Name</th>
                <th>Relationship</th>
              </tr>
              <tr>
                <td><span class="blank">[ITEM 1 DESCRIPTION]</span></td>
                <td><span class="blank">[BENEFICIARY 1 NAME]</span></td>
                <td><span class="blank">[RELATIONSHIP]</span></td>
              </tr>
              <tr>
                <td><span class="blank">[ITEM 2 DESCRIPTION]</span></td>
                <td><span class="blank">[BENEFICIARY 2 NAME]</span></td>
                <td><span class="blank">[RELATIONSHIP]</span></td>
              </tr>
              <tr>
                <td><span class="blank">[ITEM 3 DESCRIPTION]</span></td>
                <td><span class="blank">[BENEFICIARY 3 NAME]</span></td>
                <td><span class="blank">[RELATIONSHIP]</span></td>
              </tr>
            </table>
          </div>
          <div class="section">
            <p><strong>4.2 Monetary Bequests:</strong></p>
            <p>I give the sum of $<span class="blank">[AMOUNT]</span> to <span class="blank">[BENEFICIARY NAME]</span></p>
            <p>I give the sum of $<span class="blank">[AMOUNT]</span> to <span class="blank">[BENEFICIARY NAME]</span></p>
            <p>I give the sum of $<span class="blank">[AMOUNT]</span> to <span class="blank">[CHARITY/ORGANIZATION NAME]</span></p>
          </div>
        </div>

        <div class="article">
          <div class="article-title">Article V - Residuary Estate</div>
          <div class="section">
            <p><strong>5.1</strong> I give, devise, and bequeath all the rest, residue, and remainder of my estate, both real and personal, of whatever kind and wherever situated, to:</p>
            <p><strong>Primary Beneficiary:</strong> <span class="blank">[PRIMARY BENEFICIARY NAME]</span> (<span class="blank">[PERCENTAGE]</span>%)</p>
            <p><strong>Secondary Beneficiary:</strong> <span class="blank">[SECONDARY BENEFICIARY NAME]</span> (<span class="blank">[PERCENTAGE]</span>%)</p>
            <p><strong>5.2</strong> If any primary beneficiary does not survive me, their share shall pass to: <span class="blank">[CONTINGENT BENEFICIARY]</span></p>
          </div>
        </div>

        <div class="article">
          <div class="article-title">Article VI - Guardian for Minor Children</div>
          <div class="section">
            <p><strong>6.1</strong> If I have minor children at the time of my death, I nominate <span class="blank">[GUARDIAN NAME]</span> of <span class="blank">[GUARDIAN ADDRESS]</span> as Guardian of the person and property of my minor children.</p>
            <p><strong>6.2</strong> If my first choice cannot serve, I nominate <span class="blank">[ALTERNATE GUARDIAN NAME]</span> as alternate Guardian.</p>
            <p><strong>6.3</strong> I direct that no bond be required of any Guardian named herein.</p>
          </div>
        </div>

        <div class="article">
          <div class="article-title">Article VII - General Provisions</div>
          <div class="section">
            <p><strong>7.1</strong> If any beneficiary named in this Will does not survive me by 30 days, they shall be deemed to have predeceased me.</p>
            <p><strong>7.2</strong> This Will shall be governed by the laws of the State of <span class="blank">[STATE]</span>.</p>
            <p><strong>7.3</strong> If any provision of this Will is deemed invalid, the remaining provisions shall remain in full force and effect.</p>
          </div>
        </div>

        <div class="signature-section">
          <p><strong>IN WITNESS WHEREOF,</strong> I have hereunto set my hand this <span class="blank">[DAY]</span> day of <span class="blank">[MONTH]</span>, <span class="blank">[YEAR]</span>.</p>
          
          <br><br>
          <p>_______________________________________</p>
          <p><span class="blank">[TESTATOR FULL NAME]</span>, Testator</p>
        </div>

        <div class="witness-section">
          <h3 style="text-align: center; margin-bottom: 20px;">ATTESTATION OF WITNESSES</h3>
          
          <p>We, the undersigned witnesses, each declare under penalty of perjury that:</p>
          <p>1. The testator signed this Will in our presence</p>
          <p>2. The testator appeared to be of sound mind and not under duress</p>
          <p>3. We signed as witnesses in the testator's presence and in the presence of each other</p>
          <p>4. We are not beneficiaries of this Will</p>

          <br>
          <table style="width: 100%;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <p><strong>WITNESS 1:</strong></p>
                <p>Signature: _________________________</p>
                <p>Print Name: <span class="blank">[WITNESS 1 NAME]</span></p>
                <p>Address: <span class="blank">[WITNESS 1 ADDRESS]</span></p>
                <p>Date: _______________</p>
              </td>
              <td style="width: 50%; vertical-align: top;">
                <p><strong>WITNESS 2:</strong></p>
                <p>Signature: _________________________</p>
                <p>Print Name: <span class="blank">[WITNESS 2 NAME]</span></p>
                <p>Address: <span class="blank">[WITNESS 2 ADDRESS]</span></p>
                <p>Date: _______________</p>
              </td>
            </tr>
          </table>
        </div>

        <div class="notary-section">
          <h3 style="text-align: center;">NOTARY ACKNOWLEDGMENT</h3>
          <p>State of <span class="blank">[STATE]</span></p>
          <p>County of <span class="blank">[COUNTY]</span></p>
          
          <p>On this <span class="blank">[DAY]</span> day of <span class="blank">[MONTH]</span>, <span class="blank">[YEAR]</span>, before me personally appeared <span class="blank">[TESTATOR NAME]</span>, who proved to me on the basis of satisfactory evidence to be the person whose name is subscribed to the within instrument and acknowledged to me that he/she executed the same in his/her authorized capacity, and that by his/her signature on the instrument the person, or the entity upon behalf of which the person acted, executed the instrument.</p>

          <p>I certify under PENALTY OF PERJURY under the laws of the State of <span class="blank">[STATE]</span> that the foregoing paragraph is true and correct.</p>

          <br>
          <p>WITNESS my hand and official seal.</p>
          <br>
          <p>_______________________________________</p>
          <p>Notary Public</p>
          <p>My commission expires: _______________</p>
        </div>

        <div class="important-notice">
          <p><strong>LEGAL DISCLAIMER:</strong> This template is for informational purposes only and does not constitute legal advice. Will requirements vary by state. Consult with a qualified estate planning attorney before executing this document to ensure it meets your state's legal requirements and properly reflects your wishes.</p>
        </div>
      </div>
    `,
  },
];

// Utility functions for working with templates
export const getTemplateById = (id: string): DocumentTemplate | undefined => {
  return DOCUMENT_TEMPLATES.find((template) => template.id === id);
};

export const getTemplateContent = (id: string): string => {
  const template = getTemplateById(id);
  return template?.content || "<p>Template not found.</p>";
};

export const getTemplateName = (id: string): string => {
  const template = getTemplateById(id);
  return template?.name || id.replace(/-/g, " ");
};

export const getAllTemplateIds = (): string[] => {
  return DOCUMENT_TEMPLATES.map((template) => template.id);
};
