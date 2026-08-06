using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FOMS.Domain.Entities;

namespace FOMS.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Client> Clients { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Employee> Employees { get; }
    DbSet<ActivityLog> ActivityLogs { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<ShipmentRate> ShipmentRates { get; }
    DbSet<SpeedPayTransaction> SpeedPayTransactions { get; }
    DbSet<PaymentAdjustment> PaymentAdjustments { get; }
    DbSet<BankBalance> BankBalances { get; }
    DbSet<TransportationExpense> TransportationExpenses { get; }
    DbSet<SupportTicket> SupportTickets { get; }
    DbSet<PaymentValidation> PaymentValidations { get; }
    DbSet<Role> Roles { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<UserActivityLog> UserActivityLogs { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<ShipmentRecord> ShipmentRecords { get; }
    DbSet<ShipmentPricing> ShipmentPricings { get; }
    DbSet<StatementOfAccount> StatementOfAccounts { get; }
    DbSet<PaymentCollection> PaymentCollections { get; }
    DbSet<OfficialReceipt> OfficialReceipts { get; }
    DbSet<ReceivableBalance> ReceivableBalances { get; }
    DbSet<AgingAccount> AgingAccounts { get; }
    DbSet<ChartOfAccount> ChartOfAccounts { get; }
    DbSet<GeneralLedgerEntry> GeneralLedgerEntries { get; }
    DbSet<JournalEntry> JournalEntries { get; }
    DbSet<TrialBalance> TrialBalances { get; }
    DbSet<PayrollRecord> PayrollRecords { get; }
    DbSet<Payslip> Payslips { get; }
    DbSet<BankAdviceRecord> BankAdviceRecords { get; }
    DbSet<PaymentConcernTicket> PaymentConcernTickets { get; }
    DbSet<DeliveryPaymentValidation> DeliveryPaymentValidations { get; }
    DbSet<PaymentTransaction> PaymentTransactions { get; }
    DbSet<PaymentReceipt> PaymentReceipts { get; }
    DbSet<CashFlowTransaction> CashFlowTransactions { get; }
    DbSet<OfficialReceiptSequence> OfficialReceiptSequences { get; }
    DbSet<PayrollDeductionLine> PayrollDeductionLines { get; }

    /// <summary>
    /// Stores processed PayMongo webhook event IDs for replay attack prevention.
    /// </summary>
    DbSet<ProcessedWebhookEvent> ProcessedWebhookEvents { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}


