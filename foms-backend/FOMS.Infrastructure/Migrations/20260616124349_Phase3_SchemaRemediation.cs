using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FOMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase3_SchemaRemediation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AgingAccounts_ClientAccounts_ClientAccountId",
                table: "AgingAccounts");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentCollections_BillingInvoices_BillingInvoiceId",
                table: "PaymentCollections");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentConcernTickets_ClientAccounts_ClientAccountId",
                table: "PaymentConcernTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentTransactions_ClientAccounts_ClientAccountId",
                table: "PaymentTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_ReceivableBalances_BillingInvoices_BillingInvoiceId",
                table: "ReceivableBalances");

            migrationBuilder.DropForeignKey(
                name: "FK_ReceivableBalances_ClientAccounts_ClientAccountId",
                table: "ReceivableBalances");

            migrationBuilder.DropForeignKey(
                name: "FK_ShipmentRecords_ClientAccounts_ClientAccountId",
                table: "ShipmentRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_StatementOfAccounts_ClientAccounts_ClientAccountId",
                table: "StatementOfAccounts");

            migrationBuilder.DropTable(
                name: "BillingInvoices");

            migrationBuilder.DropTable(
                name: "CashFlowEntries");

            migrationBuilder.DropTable(
                name: "ClientAccounts");

            migrationBuilder.RenameColumn(
                name: "ClientAccountId",
                table: "StatementOfAccounts",
                newName: "ClientId");

            migrationBuilder.RenameIndex(
                name: "IX_StatementOfAccounts_ClientAccountId",
                table: "StatementOfAccounts",
                newName: "IX_StatementOfAccounts_ClientId");

            migrationBuilder.RenameColumn(
                name: "ClientAccountId",
                table: "ShipmentRecords",
                newName: "ClientId");

            migrationBuilder.RenameIndex(
                name: "IX_ShipmentRecords_ClientAccountId",
                table: "ShipmentRecords",
                newName: "IX_ShipmentRecords_ClientId");

            migrationBuilder.RenameColumn(
                name: "ClientAccountId",
                table: "ReceivableBalances",
                newName: "ClientId");

            migrationBuilder.RenameColumn(
                name: "BillingInvoiceId",
                table: "ReceivableBalances",
                newName: "InvoiceId");

            migrationBuilder.RenameIndex(
                name: "IX_ReceivableBalances_ClientAccountId",
                table: "ReceivableBalances",
                newName: "IX_ReceivableBalances_ClientId");

            migrationBuilder.RenameIndex(
                name: "IX_ReceivableBalances_BillingInvoiceId",
                table: "ReceivableBalances",
                newName: "IX_ReceivableBalances_InvoiceId");

            migrationBuilder.RenameColumn(
                name: "ClientAccountId",
                table: "PaymentTransactions",
                newName: "ClientId");

            migrationBuilder.RenameIndex(
                name: "IX_PaymentTransactions_ClientAccountId",
                table: "PaymentTransactions",
                newName: "IX_PaymentTransactions_ClientId");

            migrationBuilder.RenameColumn(
                name: "ClientAccountId",
                table: "PaymentConcernTickets",
                newName: "ClientId");

            migrationBuilder.RenameIndex(
                name: "IX_PaymentConcernTickets_ClientAccountId",
                table: "PaymentConcernTickets",
                newName: "IX_PaymentConcernTickets_ClientId");

            migrationBuilder.RenameColumn(
                name: "BillingInvoiceId",
                table: "PaymentCollections",
                newName: "InvoiceId");

            migrationBuilder.RenameIndex(
                name: "IX_PaymentCollections_BillingInvoiceId",
                table: "PaymentCollections",
                newName: "IX_PaymentCollections_InvoiceId");

            migrationBuilder.RenameColumn(
                name: "ClientAccountId",
                table: "AgingAccounts",
                newName: "ClientId");

            migrationBuilder.RenameIndex(
                name: "IX_AgingAccounts_ClientAccountId",
                table: "AgingAccounts",
                newName: "IX_AgingAccounts_ClientId");

            migrationBuilder.AlterColumn<string>(
                name: "OrNumber",
                table: "Payments",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "InvoiceNo",
                table: "Invoices",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "ClientId",
                table: "Invoices",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "Date",
                table: "CashFlowTransactions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReferenceNo",
                table: "CashFlowTransactions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "OfficialReceiptSequences",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LastYear = table.Column<int>(type: "int", nullable: false),
                    LastOrNumber = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfficialReceiptSequences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PayrollDeductionLines",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PayrollRecordId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DeductionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollDeductionLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayrollDeductionLines_PayrollRecords_PayrollRecordId",
                        column: x => x.PayrollRecordId,
                        principalTable: "PayrollRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_OrNumber",
                table: "Payments",
                column: "OrNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ClientId",
                table: "Invoices",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_InvoiceNo",
                table: "Invoices",
                column: "InvoiceNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PayrollDeductionLines_PayrollRecordId",
                table: "PayrollDeductionLines",
                column: "PayrollRecordId");

            migrationBuilder.AddForeignKey(
                name: "FK_AgingAccounts_Clients_ClientId",
                table: "AgingAccounts",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Clients_ClientId",
                table: "Invoices",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentCollections_Invoices_InvoiceId",
                table: "PaymentCollections",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentConcernTickets_Clients_ClientId",
                table: "PaymentConcernTickets",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentTransactions_Clients_ClientId",
                table: "PaymentTransactions",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ReceivableBalances_Clients_ClientId",
                table: "ReceivableBalances",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ReceivableBalances_Invoices_InvoiceId",
                table: "ReceivableBalances",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ShipmentRecords_Clients_ClientId",
                table: "ShipmentRecords",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StatementOfAccounts_Clients_ClientId",
                table: "StatementOfAccounts",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AgingAccounts_Clients_ClientId",
                table: "AgingAccounts");

            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Clients_ClientId",
                table: "Invoices");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentCollections_Invoices_InvoiceId",
                table: "PaymentCollections");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentConcernTickets_Clients_ClientId",
                table: "PaymentConcernTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentTransactions_Clients_ClientId",
                table: "PaymentTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_ReceivableBalances_Clients_ClientId",
                table: "ReceivableBalances");

            migrationBuilder.DropForeignKey(
                name: "FK_ReceivableBalances_Invoices_InvoiceId",
                table: "ReceivableBalances");

            migrationBuilder.DropForeignKey(
                name: "FK_ShipmentRecords_Clients_ClientId",
                table: "ShipmentRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_StatementOfAccounts_Clients_ClientId",
                table: "StatementOfAccounts");

            migrationBuilder.DropTable(
                name: "OfficialReceiptSequences");

            migrationBuilder.DropTable(
                name: "PayrollDeductionLines");

            migrationBuilder.DropIndex(
                name: "IX_Payments_OrNumber",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ClientId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_InvoiceNo",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "CashFlowTransactions");

            migrationBuilder.DropColumn(
                name: "ReferenceNo",
                table: "CashFlowTransactions");

            migrationBuilder.RenameColumn(
                name: "ClientId",
                table: "StatementOfAccounts",
                newName: "ClientAccountId");

            migrationBuilder.RenameIndex(
                name: "IX_StatementOfAccounts_ClientId",
                table: "StatementOfAccounts",
                newName: "IX_StatementOfAccounts_ClientAccountId");

            migrationBuilder.RenameColumn(
                name: "ClientId",
                table: "ShipmentRecords",
                newName: "ClientAccountId");

            migrationBuilder.RenameIndex(
                name: "IX_ShipmentRecords_ClientId",
                table: "ShipmentRecords",
                newName: "IX_ShipmentRecords_ClientAccountId");

            migrationBuilder.RenameColumn(
                name: "ClientId",
                table: "ReceivableBalances",
                newName: "ClientAccountId");

            migrationBuilder.RenameColumn(
                name: "InvoiceId",
                table: "ReceivableBalances",
                newName: "BillingInvoiceId");

            migrationBuilder.RenameIndex(
                name: "IX_ReceivableBalances_ClientId",
                table: "ReceivableBalances",
                newName: "IX_ReceivableBalances_ClientAccountId");

            migrationBuilder.RenameIndex(
                name: "IX_ReceivableBalances_InvoiceId",
                table: "ReceivableBalances",
                newName: "IX_ReceivableBalances_BillingInvoiceId");

            migrationBuilder.RenameColumn(
                name: "ClientId",
                table: "PaymentTransactions",
                newName: "ClientAccountId");

            migrationBuilder.RenameIndex(
                name: "IX_PaymentTransactions_ClientId",
                table: "PaymentTransactions",
                newName: "IX_PaymentTransactions_ClientAccountId");

            migrationBuilder.RenameColumn(
                name: "ClientId",
                table: "PaymentConcernTickets",
                newName: "ClientAccountId");

            migrationBuilder.RenameIndex(
                name: "IX_PaymentConcernTickets_ClientId",
                table: "PaymentConcernTickets",
                newName: "IX_PaymentConcernTickets_ClientAccountId");

            migrationBuilder.RenameColumn(
                name: "InvoiceId",
                table: "PaymentCollections",
                newName: "BillingInvoiceId");

            migrationBuilder.RenameIndex(
                name: "IX_PaymentCollections_InvoiceId",
                table: "PaymentCollections",
                newName: "IX_PaymentCollections_BillingInvoiceId");

            migrationBuilder.RenameColumn(
                name: "ClientId",
                table: "AgingAccounts",
                newName: "ClientAccountId");

            migrationBuilder.RenameIndex(
                name: "IX_AgingAccounts_ClientId",
                table: "AgingAccounts",
                newName: "IX_AgingAccounts_ClientAccountId");

            migrationBuilder.AlterColumn<string>(
                name: "OrNumber",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "InvoiceNo",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "ClientId",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.CreateTable(
                name: "CashFlowEntries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Date = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReferenceNo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashFlowEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClientAccounts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BusinessName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactPerson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreditLimit = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentBalance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    DateRegistered = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientAccounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BillingInvoices",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClientAccountId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    InvoiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IssueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaymentStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingInvoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillingInvoices_ClientAccounts_ClientAccountId",
                        column: x => x.ClientAccountId,
                        principalTable: "ClientAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillingInvoices_ClientAccountId",
                table: "BillingInvoices",
                column: "ClientAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_AgingAccounts_ClientAccounts_ClientAccountId",
                table: "AgingAccounts",
                column: "ClientAccountId",
                principalTable: "ClientAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentCollections_BillingInvoices_BillingInvoiceId",
                table: "PaymentCollections",
                column: "BillingInvoiceId",
                principalTable: "BillingInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentConcernTickets_ClientAccounts_ClientAccountId",
                table: "PaymentConcernTickets",
                column: "ClientAccountId",
                principalTable: "ClientAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentTransactions_ClientAccounts_ClientAccountId",
                table: "PaymentTransactions",
                column: "ClientAccountId",
                principalTable: "ClientAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ReceivableBalances_BillingInvoices_BillingInvoiceId",
                table: "ReceivableBalances",
                column: "BillingInvoiceId",
                principalTable: "BillingInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ReceivableBalances_ClientAccounts_ClientAccountId",
                table: "ReceivableBalances",
                column: "ClientAccountId",
                principalTable: "ClientAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ShipmentRecords_ClientAccounts_ClientAccountId",
                table: "ShipmentRecords",
                column: "ClientAccountId",
                principalTable: "ClientAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StatementOfAccounts_ClientAccounts_ClientAccountId",
                table: "StatementOfAccounts",
                column: "ClientAccountId",
                principalTable: "ClientAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
