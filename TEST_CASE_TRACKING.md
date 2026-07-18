# FOMS Test Case Tracking

Based on the provided Test Case Document, here is the tracking of all implemented test cases in the system. All test cases below have been implemented and are marked with a check icon (`✅`). 

> **Note on Assistant Finance Manager:** As instructed, the Assistant Finance Manager role has NO modules assigned per this document. The sidebar is kept minimal (Dashboard and Profile only). AR, Payments, Receipts, and Reports access have NOT been added to this role.

---

## SPRINT 1

| Status | TC ID | PB/FR | Feature / Objective | Roles |
|:---:|:---|:---|:---|:---|
| ✅ | **TC-S1-001** | PB-001 / FR-001, FR-002 | **User Login Authentication**<br/>Verify secure login using registered credentials. | Financial Manager, Head Accountant, Accountant, Coordinator, Asst. Fin. Manager, Client |
| ✅ | **TC-S1-002** | PB-002 / FR-003 | **Secure Logout**<br/>Verify that logout securely terminates the user session. | All Roles |
| ✅ | **TC-S1-003** | PB-003 / FR-004, FR-005 | **Unauthorized Access and RBAC**<br/>Verify access restrictions and role-based permissions. | All Roles |
| ✅ | **TC-S1-004** | PB-004 / FR-006, FR-007 | **Profile and Secure Session**<br/>Verify personal profile information and automatic session expiration. | All Roles |
| ✅ | **TC-S1-005** | PB-005 / FR-008 | **Manage Client Account**<br/>Verify creation, viewing, and updating of client account information. | Accountant |
| ✅ | **TC-S1-006** | PB-006 / FR-009 | **Search Client Account**<br/>Verify client account search functionality. | Accountant, Coordinator |
| ✅ | **TC-S1-007** | PB-007 / FR-010 | **Manage Client Billing Rate**<br/>Verify recording and updating of client-specific billing rates. | Accountant |
| ✅ | **TC-S1-008** | PB-008 / FR-011 | **Record Waybill or POD**<br/>Verify recording of completed delivery waybill/POD details. | Coordinator |
| ✅ | **TC-S1-009** | PB-009 / FR-012 | **Validate Original POD or Waybill**<br/>Verify that billing is blocked until original documents are validated. | Coordinator |
| ✅ | **TC-S1-010** | PB-010 / FR-013 | **Use Validated Record for Billing**<br/>Verify that only validated records can be selected during invoice creation. | Accountant |
| ✅ | **TC-S1-011** | PB-011 / FR-014 | **Record Certified True Copy**<br/>Verify recording of an approved certified true copy document. | Coordinator |

---

## SPRINT 2

| Status | TC ID | PB/FR | Feature / Objective | Roles |
|:---:|:---|:---|:---|:---|
| ✅ | **TC-S2-001** | PB-012 / FR-015 | **Create Invoice**<br/>Verify invoice creation from complete and validated billing records. | Accountant |
| ✅ | **TC-S2-002** | PB-013 / FR-016 | **Calculate Billing Charges**<br/>Verify accurate billing charge calculation. | Accountant |
| ✅ | **TC-S2-003** | PB-014 / FR-017 | **Compute Invoice Total**<br/>Verify the invoice total amount calculation. | Accountant |
| ✅ | **TC-S2-004** | PB-015 / FR-018 | **Apply Billing Schedule**<br/>Verify generation of invoices according to the configured billing schedule. | Accountant |
| ✅ | **TC-S2-005** | PB-016 / FR-019 | **Review and Verify Invoice**<br/>Verify invoice review by the Head Accountant. | Head Accountant |
| ✅ | **TC-S2-006** | PB-017 / FR-020 | **Finalize Verified Invoice**<br/>Verify that invoice finalization requires prior verification. | Head Accountant |
| ✅ | **TC-S2-007** | PB-018 / FR-021 | **Monitor Invoice Status**<br/>Verify display of invoice workflow and payment statuses. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S2-008** | PB-019 / FR-022 | **Automatic Invoice Status Update**<br/>Verify automatic invoice status changes. | Accountant |
| ✅ | **TC-S2-009** | PB-020 / FR-023 | **Record Invoice as AR**<br/>Verify automatic Accounts Receivable creation. | Accountant |
| ✅ | **TC-S2-010** | PB-021 / FR-024 | **Monitor AR per Client**<br/>Verify Accounts Receivable monitoring by client. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S2-011** | PB-022 / FR-025 | **Track Outstanding Balance**<br/>Verify outstanding balance details. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S2-012** | PB-023 / FR-026 | **Categorize Unpaid Invoices**<br/>Verify categorization of unpaid receivables. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S2-013** | PB-024 / FR-027 | **Weekly Aging Monitoring**<br/>Verify weekly aging review functionality. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S2-014** | PB-025 / FR-028 | **Compute 30-Day Due Date**<br/>Verify automatic due-date computation. | Accountant |
| ✅ | **TC-S2-015** | PB-026 / FR-029 | **Record Client Payment**<br/>Verify manual recording of a client payment. | Accountant |
| ✅ | **TC-S2-016** | PB-027 / FR-030 | **Link Payment to Invoice**<br/>Verify required payment-to-invoice matching. | Accountant |
| ✅ | **TC-S2-017** | PB-028 / FR-031 | **Mark Fully Paid Invoice**<br/>Verify Paid status after full payment. | Accountant |
| ✅ | **TC-S2-018** | PB-029 / FR-032 | **Prevent Incomplete Payment Status**<br/>Verify that an incomplete amount cannot produce Paid status. | Accountant |
| ✅ | **TC-S2-019** | PB-030 / FR-033 | **Validate Payment Transaction**<br/>Verify authorized payment validation and unauthorized access restriction. | Head Accountant, Accountant |
| ✅ | **TC-S2-020** | PB-031 / FR-034 | **Confirm Company Account Receipt**<br/>Verify company-account confirmation before official recording. | Head Accountant, Accountant |
| ✅ | **TC-S2-021** | PB-032 / FR-035 | **Record Payment Reference Details**<br/>Verify storage of payment reference documentation. | Accountant |

---

## SPRINT 3

| Status | TC ID | PB/FR | Feature / Objective | Roles |
|:---:|:---|:---|:---|:---|
| ✅ | **TC-S3-001** | PB-033 / FR-036 | **Select Unpaid Invoice**<br/>Verify selection of an unpaid invoice in SpeedPay. | Client |
| ✅ | **TC-S3-002** | PB-034 / FR-037 | **Choose Payment Method**<br/>Verify selection of simulated online payment methods. | Client |
| ✅ | **TC-S3-003** | PB-035 / FR-038 | **Upload Proof of Payment**<br/>Verify upload of valid proof of payment. | Client |
| ✅ | **TC-S3-004** | PB-036 / FR-039 | **Submit Payment Details**<br/>Verify complete SpeedPay submission. | Client |
| ✅ | **TC-S3-005** | PB-037 / FR-040 | **View SpeedPay Status**<br/>Verify SpeedPay status tracking. | Client, Accountant |
| ✅ | **TC-S3-006** | PB-038 / FR-041 | **Record Official Receipt**<br/>Verify official receipt recording after validation. | Accountant |
| ✅ | **TC-S3-007** | PB-039 / FR-042 | **Link Receipt to Invoice and Payment**<br/>Verify traceability of official receipt records. | Accountant |
| ✅ | **TC-S3-008** | PB-040 / FR-043 | **Generate Financial Report**<br/>Verify generation of a finance report. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S3-009** | PB-041 / FR-044 | **Generate Aging of Accounts Report**<br/>Verify Aging of Accounts report generation. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S3-010** | PB-042 / FR-045 | **Generate Invoice and Collection Reports**<br/>Verify supporting finance report generation. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S3-011** | PB-043 / FR-046 | **Export Financial Report**<br/>Verify financial report export. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S3-012** | PB-044 / FR-047 | **View Dashboard Summary**<br/>Verify accuracy of dashboard finance summaries. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S3-013** | PB-045 / FR-048 | **View Client Billing History**<br/>Verify client billing-history details. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S3-014** | PB-046 / FR-049 | **View Accounts Near Due Date**<br/>Verify display of due-soon accounts. | Fin. Manager, Head Accountant, Accountant |
| ✅ | **TC-S3-015** | PB-047 / FR-050 | **Record Important User Activities**<br/>Verify generation of audit entries for important actions. | Fin. Manager, Head Accountant |
| ✅ | **TC-S3-016** | PB-048 / FR-051 | **Store Audit Trail Details**<br/>Verify completeness of audit-log information. | Fin. Manager, Head Accountant |
| ✅ | **TC-S3-017** | PB-049 / FR-052 | **Track Financial Record Changes**<br/>Verify change history for important financial records. | Fin. Manager, Head Accountant |
