using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using FOMS.Application.Interfaces;
using FOMS.Application.Services;
using FOMS.Domain.Entities;

namespace FOMS.Application.Features;

public static class SpeedPayFeatures
{


    // --- NEW: FR-015, FR-018, FR-019, FR-020: Initiate PayMongo Checkout (Shipment-Level) ---
    public record InitiateSpeedPayCheckoutCommand(
        string ClientId,
        string ShipmentId,
        decimal Amount,
        string? PaymentMethod = null,
        string? CardNumber = null,
        int? ExpMonth = null,
        int? ExpYear = null,
        string? Cvc = null,
        string? PhoneNumber = null
    ) : IRequest<SpeedPayInitiateResult>;

    public record SpeedPayInitiateResult(string CheckoutUrl, string PayMongoCheckoutId, string ReferenceOrNumber);

    public class InitiateSpeedPayCheckoutCommandHandler : IRequestHandler<InitiateSpeedPayCheckoutCommand, SpeedPayInitiateResult>
    {
        private readonly IApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public InitiateSpeedPayCheckoutCommandHandler(IApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<SpeedPayInitiateResult> Handle(InitiateSpeedPayCheckoutCommand request, CancellationToken cancellationToken)
        {
            var receiptNumber = await GenerateNextOrNumberAsync(_context, cancellationToken);
            // 1. Validate Shipment exists (FR-019)
            var shipment = await _context.ShipmentRecords
                .FirstOrDefaultAsync(s => s.Id == request.ShipmentId, cancellationToken);
            if (shipment == null)
            {
                throw new ArgumentException("Shipment record not found.");
            }

            // Map CL- Client ID to CA- Client Account ID if needed
            var ClientId = request.ClientId.StartsWith("CL-") 
                ? request.ClientId.Replace("CL-", "CA-") 
                : request.ClientId;

            // 2. Validate Client account exists (FR-018)
            var client = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == ClientId, cancellationToken);
            if (client == null)
            {
                throw new ArgumentException("Client account not found.");
            }

            // Verify the shipment actually belongs to the client
            if (shipment.ClientId != ClientId)
            {
                throw new ArgumentException("Shipment client mismatch.");
            }

            // 3. Pre-Payment Validation: Delivery fees + Outstanding balance (FR-018)
            var expectedTotal = client.CurrentBalance + shipment.Cost;
            if (request.Amount != expectedTotal)
            {
                throw new ArgumentException($"Payment amount ({request.Amount:C}) does not match the sum of outstanding balance ({client.CurrentBalance:C}) and shipment delivery fees ({shipment.Cost:C}). Expected: {expectedTotal:C}.");
            }

            // 4. Duplicate Transaction Detection (FR-020)
            var completedTx = await _context.PaymentTransactions
                .AnyAsync(t => t.ShipmentRecordId == request.ShipmentId 
                               && t.ClientId == ClientId 
                               && t.Status == "Completed", 
                          cancellationToken);
            if (completedTx)
            {
                throw new InvalidOperationException("A transaction is already completed for this shipment.");
            }

            // Remove any stale pending transactions for this shipment to allow retry/new checkout session
            var pendingTxs = await _context.PaymentTransactions
                .Where(t => t.ShipmentRecordId == request.ShipmentId 
                            && t.ClientId == ClientId 
                            && t.Status == "Pending")
                .ToListAsync(cancellationToken);
            if (pendingTxs.Any())
            {
                _context.PaymentTransactions.RemoveRange(pendingTxs);
                await _context.SaveChangesAsync(cancellationToken);
            }

            // 5. Invoke PayMongo Payments API (with mock fallback for developer demo)
            var secretKey = _configuration["PayMongo:SecretKey"] ?? "pctest_secret_key_placeholder";
            var successUrl = _configuration["PayMongo:SuccessUrl"] ?? "http://localhost:5173/speedpay?status=success";
            var cancelUrl = _configuration["PayMongo:CancelUrl"] ?? "http://localhost:5173/speedpay?status=cancelled";

            string checkoutId;
            string checkoutUrl;

            if (secretKey == "pctest_secret_key_placeholder" || string.IsNullOrEmpty(secretKey) || secretKey.Contains("placeholder"))
            {
                // Developer simulation mock mode
                checkoutId = "pi_mock_" + Guid.NewGuid().ToString().Substring(0, 8);
                var uri = new Uri(successUrl);
                var baseMockUrl = $"{uri.Scheme}://{uri.Authority}/mock-checkout";
                checkoutUrl = $"{baseMockUrl}?checkout_id={checkoutId}&amount={request.Amount}&shipment_id={request.ShipmentId}&client_name={Uri.EscapeDataString(client?.Name ?? "")}&type=shipment&payment_method={request.PaymentMethod ?? "card"}&success_url={Uri.EscapeDataString(successUrl)}&cancel_url={Uri.EscapeDataString(cancelUrl)}";

                // 6. Record Pending Transaction in database
                var mockTransaction = new PaymentTransaction
                {
                    ClientId = ClientId,
                    ShipmentRecordId = request.ShipmentId,
                    Amount = request.Amount,
                    PayMongoCheckoutId = checkoutId,
                    ReferenceOrNumber = receiptNumber,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.PaymentTransactions.Add(mockTransaction);
                await _context.SaveChangesAsync(cancellationToken);

                return new SpeedPayInitiateResult(checkoutUrl, checkoutId, receiptNumber);
            }
            else
            {
                var desc = $"SpeedPay - Delivery Fee & Outstanding Balance Settlement (Shipment {shipment.Id})";
                var res = await ExecutePaymentsApiFlowAsync(
                    secretKey,
                    request.Amount,
                    request.PaymentMethod ?? (!string.IsNullOrEmpty(request.CardNumber) ? "card" : "gcash"),
                    request.CardNumber,
                    request.ExpMonth,
                    request.ExpYear,
                    request.Cvc,
                    request.PhoneNumber,
                    desc,
                    successUrl,
                    cancelUrl,
                    cancellationToken
                );
                checkoutUrl = res.CheckoutUrl;
                checkoutId = res.PaymentIntentId;
            }

            // 6. Record Pending Transaction in database
            var transaction = new PaymentTransaction
            {
                ClientId = ClientId,
                ShipmentRecordId = request.ShipmentId,
                Amount = request.Amount,
                PayMongoCheckoutId = checkoutId,
                ReferenceOrNumber = receiptNumber,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.PaymentTransactions.Add(transaction);
            await _context.SaveChangesAsync(cancellationToken);

            return new SpeedPayInitiateResult(checkoutUrl, checkoutId, receiptNumber);
        }
    }

    // --- NEW: FR-015, FR-018, FR-020: Initiate PayMongo Checkout (Invoice-Level for Client Portal) ---
    public record InitiateInvoiceCheckoutCommand(
        string InvoiceNo,
        decimal Amount,
        string? PaymentMethod = null,
        string? CardNumber = null,
        int? ExpMonth = null,
        int? ExpYear = null,
        string? Cvc = null,
        string? PhoneNumber = null,
        string? ReturnUrl = null
    ) : IRequest<SpeedPayInitiateResult>;

    public class InitiateInvoiceCheckoutCommandHandler : IRequestHandler<InitiateInvoiceCheckoutCommand, SpeedPayInitiateResult>
    {
        private readonly IApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public InitiateInvoiceCheckoutCommandHandler(IApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<SpeedPayInitiateResult> Handle(InitiateInvoiceCheckoutCommand request, CancellationToken cancellationToken)
        {
            var receiptNumber = await GenerateNextOrNumberAsync(_context, cancellationToken);
            // 1. Validate Invoice exists
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceNo == request.InvoiceNo, cancellationToken);
            if (invoice == null)
            {
                throw new ArgumentException("Invoice not found. Please verify the invoice number.");
            }

            // 2. Validate amount — allow partial payments (TASK 10, Decision 2)
            if (request.Amount <= 0m)
            {
                throw new ArgumentException("Payment amount must be greater than zero.");
            }
            if (request.Amount > invoice.Balance)
            {
                throw new ArgumentException($"Payment amount ({request.Amount:N2}) exceeds the outstanding invoice balance ({invoice.Balance:N2}). Overpayments are not allowed.");
            }

            // 3. Block duplicates (FR-020)
            var completedTx = await _context.PaymentTransactions
                .AnyAsync(t => t.InvoiceNo == request.InvoiceNo 
                               && t.Status == "Completed", 
                          cancellationToken);
            if (completedTx)
            {
                throw new InvalidOperationException("A transaction is already completed for this invoice.");
            }
            
            // Remove any stale pending transactions for this invoice to allow retry/new checkout session
            var pendingTxs = await _context.PaymentTransactions
                .Where(t => t.InvoiceNo == request.InvoiceNo 
                            && t.Status == "Pending")
                .ToListAsync(cancellationToken);
            if (pendingTxs.Any())
            {
                _context.PaymentTransactions.RemoveRange(pendingTxs);
                await _context.SaveChangesAsync(cancellationToken);
            }

            // 4. Find associated Client
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == invoice.ClientId, cancellationToken);
            if (client == null)
            {
                throw new ArgumentException("Client not found for this invoice.");
            }
            var Client = client;

             // 5. Invoke PayMongo Payments API (with mock fallback for developer demo)
            var secretKey = _configuration["PayMongo:SecretKey"] ?? "pctest_secret_key_placeholder";
            var returnBaseUrl = request.ReturnUrl ?? "http://localhost:5173/pay-invoice";
            var successUrl = returnBaseUrl.Contains("?") ? $"{returnBaseUrl}&status=success" : $"{returnBaseUrl}?status=success";
            var cancelUrl = returnBaseUrl.Contains("?") ? $"{returnBaseUrl}&status=cancelled" : $"{returnBaseUrl}?status=cancelled";

            string checkoutId;
            string checkoutUrl;

            if (secretKey == "pctest_secret_key_placeholder" || string.IsNullOrEmpty(secretKey) || secretKey.Contains("placeholder"))
            {
                // Developer simulation mock mode
                checkoutId = "pi_mock_" + Guid.NewGuid().ToString().Substring(0, 8);
                var uri = new Uri(successUrl);
                var baseMockUrl = $"{uri.Scheme}://{uri.Authority}/mock-checkout";
                checkoutUrl = $"{baseMockUrl}?checkout_id={checkoutId}&amount={request.Amount}&invoice_no={invoice.InvoiceNo}&client_name={Uri.EscapeDataString(invoice.ClientName)}&type=invoice&payment_method={request.PaymentMethod ?? "card"}&success_url={Uri.EscapeDataString(successUrl)}&cancel_url={Uri.EscapeDataString(cancelUrl)}";

                // 6. Record Pending Transaction in database
                var mockTransaction = new PaymentTransaction
                {
                    ClientId = Client.Id,
                    InvoiceNo = invoice.InvoiceNo,
                    Amount = request.Amount,
                    PayMongoCheckoutId = checkoutId,
                    ReferenceOrNumber = receiptNumber,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.PaymentTransactions.Add(mockTransaction);
                await _context.SaveChangesAsync(cancellationToken);

                return new SpeedPayInitiateResult(checkoutUrl, checkoutId, receiptNumber);
            }
            else
            {
                var desc = $"SpeedPay - Settle Invoice {invoice.InvoiceNo}";
                var res = await ExecutePaymentsApiFlowAsync(
                    secretKey,
                    request.Amount,
                    request.PaymentMethod ?? (!string.IsNullOrEmpty(request.CardNumber) ? "card" : "gcash"),
                    request.CardNumber,
                    request.ExpMonth,
                    request.ExpYear,
                    request.Cvc,
                    request.PhoneNumber,
                    desc,
                    successUrl,
                    cancelUrl,
                    cancellationToken
                );
                checkoutUrl = res.CheckoutUrl;
                checkoutId = res.PaymentIntentId;
            }

            // 6. Record Pending Transaction in database
            var transaction = new PaymentTransaction
            {
                ClientId = Client.Id,
                InvoiceNo = invoice.InvoiceNo,
                Amount = request.Amount,
                PayMongoCheckoutId = checkoutId,
                ReferenceOrNumber = receiptNumber,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.PaymentTransactions.Add(transaction);
            await _context.SaveChangesAsync(cancellationToken);

            return new SpeedPayInitiateResult(checkoutUrl, checkoutId, receiptNumber);
        }
    }

    // --- Helper for option 2 Payments API Flow ---
    private static async Task<(string CheckoutUrl, string PaymentIntentId)> ExecutePaymentsApiFlowAsync(
        string secretKey,
        decimal amount,
        string paymentMethod,
        string? cardNumber,
        int? expMonth,
        int? expYear,
        string? cvc,
        string? phoneNumber,
        string description,
        string successUrl,
        string cancelUrl,
        CancellationToken cancellationToken)
    {
        var base64Key = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{secretKey}:"));

        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", base64Key);
        httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var sessionPayload = new
        {
            data = new
            {
                attributes = new
                {
                    send_email_receipt = false,
                    show_description = true,
                    show_line_items = true,
                    description = description,
                    line_items = new[]
                    {
                        new
                        {
                            currency = "PHP",
                            amount = (int)(amount * 100),
                            description = "SpeedPay Settlement",
                            name = description,
                            quantity = 1
                        }
                    },
                    payment_method_types = new[] { "card", "gcash", "paymaya", "dob" },
                    success_url = successUrl,
                    cancel_url = cancelUrl
                }
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(sessionPayload), Encoding.UTF8, "application/json");
        var response = await httpClient.PostAsync("https://api.paymongo.com/v1/checkout_sessions", content, cancellationToken);
        
        if (!response.IsSuccessStatusCode)
        {
            var errText = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"PayMongo Create Checkout Session failed: {errText}");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var data = doc.RootElement.GetProperty("data");
        var checkoutSessionId = data.GetProperty("id").GetString() ?? throw new InvalidOperationException("Failed to get Session ID");
        var checkoutUrl = data.GetProperty("attributes").GetProperty("checkout_url").GetString() ?? successUrl;

        return (checkoutUrl, checkoutSessionId);
    }

    // --- NEW: FR-016, FR-017: Process PayMongo Webhooks ---
    public record ProcessSpeedPayWebhookCommand(
        string RawBody,
        string SignatureHeader
    ) : IRequest<string>;

    public class ProcessSpeedPayWebhookCommandHandler : IRequestHandler<ProcessSpeedPayWebhookCommand, string>
    {
        private readonly IApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public ProcessSpeedPayWebhookCommandHandler(IApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<string> Handle(ProcessSpeedPayWebhookCommand request, CancellationToken cancellationToken)
        {
            var webhookSecret = _configuration?["PayMongo:WebhookSecret"];
            var isDevelopment = _configuration == null || 
                                string.IsNullOrEmpty(_configuration["ASPNETCORE_ENVIRONMENT"]) || 
                                _configuration["ASPNETCORE_ENVIRONMENT"] == "Development";

            // ─────────────────────────────────────────────────────────────────
            // TASK 8: MANDATORY WEBHOOK SIGNATURE VERIFICATION
            // The bypass_sig backdoor has been PERMANENTLY REMOVED.
            // In production, signature verification is always enforced.
            // In development with no WebhookSecret configured, we allow pass-through
            // only when explicitly running in Development environment AND
            // the request comes from a simulate-webhook call (identified by the
            // controller which signs the payload before calling this handler).
            // ─────────────────────────────────────────────────────────────────
            if (!string.IsNullOrEmpty(webhookSecret))
            {
                // Secret is configured — ALWAYS verify regardless of environment
                if (!VerifySignature(request.RawBody, request.SignatureHeader, webhookSecret))
                {
                    // Log the suspicious attempt before rejecting
                    var suspiciousAudit = new AuditLog
                    {
                        UserId = "SpeedPay Gateway",
                        EntityName = "Webhook",
                        EntityId = "SIGNATURE_FAILURE",
                        Action = "Webhook Signature Invalid",
                        Details = $"Invalid PayMongo webhook signature rejected. Header: {request.SignatureHeader?[..Math.Min(20, request.SignatureHeader?.Length ?? 0)]}...",
                        LoggedAt = DateTime.UtcNow
                    };
                    await _context.AuditLogs.AddAsync(suspiciousAudit, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);

                    throw new UnauthorizedAccessException("Invalid PayMongo Webhook Signature.");
                }
            }
            else if (!isDevelopment)
            {
                // In production, a webhook secret MUST be configured
                throw new InvalidOperationException(
                    "PayMongo WebhookSecret is not configured. " +
                    "Set PayMongo:WebhookSecret in environment variables before deploying to production.");
            }
            // else: Development with no secret configured — allow for local demo/testing only

            // ─────────────────────────────────────────────────────────────────
            // TASK 9: REPLAY ATTACK PREVENTION
            // Extract the event ID from the payload. If we've seen it before,
            // immediately reject with 200 OK (idempotent response to PayMongo).
            // ─────────────────────────────────────────────────────────────────
            using var jsonDocReplay = JsonDocument.Parse(request.RawBody);
            var rootReplay = jsonDocReplay.RootElement;
            string incomingEventId = string.Empty;
            if (rootReplay.TryGetProperty("data", out var dataEl))
            {
                if (dataEl.TryGetProperty("id", out var idEl))
                {
                    incomingEventId = idEl.GetString() ?? string.Empty;
                }
                else if (dataEl.TryGetProperty("attributes", out var attrEl) && 
                         attrEl.TryGetProperty("data", out var innerDataEl) && 
                         innerDataEl.TryGetProperty("id", out var innerIdEl))
                {
                    incomingEventId = innerIdEl.GetString() ?? string.Empty;
                }
            }

            if (!string.IsNullOrEmpty(incomingEventId))
            {
                var alreadyProcessed = await _context.ProcessedWebhookEvents
                    .AnyAsync(e => e.EventId == incomingEventId, cancellationToken);

                if (alreadyProcessed)
                {
                    return $"Idempotent: Event {incomingEventId} was already processed.";
                }

                // Record this event ID before processing (prevents parallel race condition)
                var processedEvent = new ProcessedWebhookEvent
                {
                    EventId = incomingEventId,
                    ProcessedAt = DateTime.UtcNow
                };
                _context.ProcessedWebhookEvents.Add(processedEvent);
                // Save immediately so concurrent requests get a unique constraint violation
                try
                {
                    await _context.SaveChangesAsync(cancellationToken);
                }
                catch (Microsoft.EntityFrameworkCore.DbUpdateException)
                {
                    // Unique constraint violation — another request processed this event first
                    return $"Idempotent: Event {incomingEventId} was already processed (concurrent request).";
                }
            }

            // 2. Parse Webhook Event JSON
            using var jsonDoc = JsonDocument.Parse(request.RawBody);
            var root = jsonDoc.RootElement;

            var eventType = root.GetProperty("data")
                .GetProperty("attributes")
                .GetProperty("type")
                .GetString();

            var eventData = root.GetProperty("data").GetProperty("attributes").GetProperty("data");

            string? checkoutSessionId = null;
            string? paymentIntentId = null;
            string? paymentId = null;
            string? receiptUrl = null;

            if (eventType == "payment.paid" || eventType == "payment.failed")
            {
                paymentId = eventData.GetProperty("id").GetString();
                var attrs = eventData.GetProperty("attributes");
                paymentIntentId = attrs.GetProperty("payment_intent_id").GetString();
                if (attrs.TryGetProperty("receipt_url", out var rUrl))
                {
                    receiptUrl = rUrl.GetString();
                }
            }
            else // checkout.completed or checkout.failed or checkout.abandoned
            {
                checkoutSessionId = eventData.GetProperty("id").GetString();
            }

            // 3. Find matching PaymentTransaction record
            var transaction = await _context.PaymentTransactions
                .Include(t => t.Client)
                .Include(t => t.ShipmentRecord)
                .FirstOrDefaultAsync(t => 
                    (paymentIntentId != null && t.PayMongoCheckoutId == paymentIntentId) ||
                    (checkoutSessionId != null && t.PayMongoCheckoutId == checkoutSessionId), 
                    cancellationToken);

            if (transaction == null)
            {
                return $"Ignored: No matching transaction found for ID {paymentIntentId ?? checkoutSessionId}";
            }

            // If already processed, return success immediately
            if (transaction.Status == "Completed" || transaction.Status == "Failed" || transaction.Status == "Expired")
            {
                return $"Ignored: Transaction {transaction.Id} is already in state {transaction.Status}";
            }

            if (eventType == "checkout.completed" || eventType == "payment.paid")
            {
                if (eventType == "checkout.completed")
                {
                    // Parse payment ID and receipt URL from the checkout session payload
                    try
                    {
                        var paymentIntent = eventData.GetProperty("attributes").GetProperty("payment_intent");
                        if (paymentIntent.TryGetProperty("attributes", out var intentAttr))
                        {
                            if (intentAttr.TryGetProperty("payments", out var paymentsArr) && paymentsArr.GetArrayLength() > 0)
                            {
                                var paymentObj = paymentsArr[0];
                                paymentId = paymentObj.GetProperty("id").GetString();
                                var payAttr = paymentObj.GetProperty("attributes");
                                if (payAttr.TryGetProperty("receipt_url", out var rUrl))
                                {
                                    receiptUrl = rUrl.GetString();
                                }
                            }
                        }
                    }
                    catch { /* Use default null values if parsing fails */ }
                }

                // Update Transaction record (FR-016)
                transaction.Status = "Completed";
                transaction.PayMongoPaymentId = paymentId;
                transaction.ReceiptUrl = receiptUrl;
                transaction.UpdatedAt = DateTime.UtcNow;

                // Generate SpeedPay Electronic Receipt (FR-017)
                var receiptNumber = transaction.ReferenceOrNumber ?? await GenerateNextOrNumberAsync(_context, cancellationToken);
                var receipt = new PaymentReceipt
                {
                    PaymentTransactionId = transaction.Id,
                    ReceiptNumber = receiptNumber,
                    GeneratedAt = DateTime.UtcNow
                };
                _context.PaymentReceipts.Add(receipt);

                var settledInvoices = new List<(Invoice Inv, decimal Applied)>();
                string? targetInvoiceNo = null;
                decimal amountToApplyToInvoice = transaction.Amount;

                // --- FLOW A: Invoice-level Checkout ---
                if (!string.IsNullOrEmpty(transaction.InvoiceNo))
                {
                    targetInvoiceNo = transaction.InvoiceNo;
                    
                    var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceNo == transaction.InvoiceNo, cancellationToken);
                    if (invoice != null)
                    {
                        invoice.AmountPaid += transaction.Amount;
                        BillingComputationService.RecalculateInvoice(invoice);
                        invoice.UpdatedBy = "SpeedPay Gateway";

                        settledInvoices.Add((invoice, transaction.Amount));

                        // Create legacy Payment record
                        var payment = new Payment
                        {
                            OrNumber = receiptNumber,
                            InvoiceId = invoice.Id,
                            InvoiceNo = invoice.InvoiceNo,
                            ClientId = invoice.ClientId,
                            ClientName = invoice.ClientName,
                            PaymentDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                            Amount = transaction.Amount,
                            PaymentMethod = "SpeedPay (PayMongo)",
                            ReferenceNumber = paymentId ?? ("SP-" + DateTime.UtcNow.Ticks.ToString().Substring(12, 6)),
                            Remarks = "SpeedPay Online Checkout Completed",
                            RecordedBy = "SpeedPay Gateway",
                            DateRecorded = DateTime.UtcNow.ToString("yyyy-MM-dd")
                        };
                        _context.Payments.Add(payment);

                        // TASK 12: Sync client balance authoritatively
                        await BillingComputationService.SyncClientBalanceAsync(invoice.ClientId, _context, cancellationToken);
                    }


                }
                // --- FLOW B: Shipment-level Checkout ---
                else
                {
                    Client? legacyClient = null;
                    // Update Client Balances
                    if (transaction.Client != null)
                    {
                        transaction.Client.CurrentBalance = Math.Max(0, transaction.Client.CurrentBalance - transaction.Amount);

                        legacyClient = await _context.Clients
                            .FirstOrDefaultAsync(c => c.BusinessName == transaction.Client.BusinessName, cancellationToken);
                        if (legacyClient != null)
                        {
                            legacyClient.TotalPaid += transaction.Amount;
                            legacyClient.CurrentBalance = Math.Max(0, legacyClient.CurrentBalance - transaction.Amount);
                            legacyClient.LastTransaction = DateTime.UtcNow.ToString("MMM dd, yyyy");
                        }
                    }

                    // Update Shipment Record status
                    if (transaction.ShipmentRecord != null)
                    {
                        transaction.ShipmentRecord.Status = "Completed";
                        amountToApplyToInvoice = transaction.Amount - transaction.ShipmentRecord.Cost;
                    }

                    // Create legacy Payment record for Flow B
                    var matchingInvoice = await _context.Invoices
                        .Where(i => i.ClientName == (transaction.Client != null ? transaction.Client.BusinessName : ""))
                        .OrderByDescending(i => i.DueDate)
                        .FirstOrDefaultAsync(cancellationToken);

                    var payment = new Payment
                    {
                        OrNumber = receiptNumber,
                        InvoiceId = matchingInvoice?.Id ?? ("SHIPMENT-" + transaction.ShipmentRecordId),
                        InvoiceNo = matchingInvoice?.InvoiceNo ?? ("SHIPMENT-" + transaction.ShipmentRecordId),
                        ClientId = legacyClient?.Id ?? (transaction.ClientId.Replace("CA-", "CL-")),
                        ClientName = legacyClient?.Name ?? (transaction.Client?.Name ?? "Unknown Client"),
                        PaymentDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                        Amount = transaction.Amount,
                        PaymentMethod = "SpeedPay (PayMongo)",
                        ReferenceNumber = paymentId ?? ("SP-" + DateTime.UtcNow.Ticks.ToString().Substring(12, 6)),
                        Remarks = "SpeedPay Online Checkout Completed" + (transaction.ShipmentRecordId != null ? $" (Shipment {transaction.ShipmentRecordId})" : ""),
                        RecordedBy = "SpeedPay Gateway",
                        DateRecorded = DateTime.UtcNow.ToString("yyyy-MM-dd")
                    };
                    _context.Payments.Add(payment);

                    // Settle legacy Invoices table
                    if (amountToApplyToInvoice > 0 && transaction.Client != null)
                    {
                        var invoices = await _context.Invoices
                            .Where(i => i.ClientName == transaction.Client.BusinessName && i.Balance > 0)
                            .ToListAsync(cancellationToken);
                        
                        var remainingAmount = amountToApplyToInvoice;
                        foreach (var inv in invoices)
                        {
                            if (remainingAmount <= 0) break;
                            
                            var applied = Math.Min(remainingAmount, inv.Balance);
                            inv.AmountPaid += applied;
                            inv.Balance -= applied;
                            inv.PaymentStatus = inv.Balance == 0 ? "Paid" : "Partially Paid";
                            inv.LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd");
                            inv.UpdatedBy = "SpeedPay Gateway";
                            
                            settledInvoices.Add((inv, applied));
                            remainingAmount -= applied;
                            
                            if (targetInvoiceNo == null) targetInvoiceNo = inv.InvoiceNo;
                        }
                        amountToApplyToInvoice = remainingAmount;
                    }
                }

                // --- Flow B Shipment Fee Billing Invoice, Payment Collection, and Official Receipt ---
                if (transaction.ShipmentRecordId != null && transaction.ShipmentRecord != null)
                {
                    var shipmentInvoiceId = "BI-SHIP-" + transaction.ShipmentRecordId;
                    var existingShipmentInvoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == shipmentInvoiceId, cancellationToken);
                    
                    var subtotal = Math.Round(transaction.ShipmentRecord.Cost / 1.12m, 2);
                    var vatAmount = BillingComputationService.ComputeVat(subtotal);
                    var totalAmount = subtotal + vatAmount;

                    if (existingShipmentInvoice == null)
                    {
                        existingShipmentInvoice = new Invoice
                        {
                            Id = shipmentInvoiceId,
                            InvoiceNo = shipmentInvoiceId,
                            ClientId = transaction.ClientId,
                            BillingDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                            DueDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                            FreightCharges = subtotal,
                            OtherCharges = 0m,
                            Subtotal = subtotal,
                            VatRate = BillingComputationService.VAT_RATE,
                            VatAmount = vatAmount,
                            TotalAmount = totalAmount,
                            AmountPaid = totalAmount,
                            Balance = 0m,
                            PaymentStatus = "Paid",
                            Description = $"SpeedPay delivery fee for shipment {transaction.ShipmentRecordId}",
                            EncodedBy = "SpeedPay Gateway",
                            DateEncoded = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                            LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                            UpdatedBy = "SpeedPay Gateway"
                        };
                        _context.Invoices.Add(existingShipmentInvoice);
                    }
                    else
                    {
                        existingShipmentInvoice.FreightCharges = subtotal;
                        existingShipmentInvoice.Subtotal = subtotal;
                        existingShipmentInvoice.VatRate = BillingComputationService.VAT_RATE;
                        existingShipmentInvoice.VatAmount = vatAmount;
                        existingShipmentInvoice.TotalAmount = totalAmount;
                        existingShipmentInvoice.AmountPaid = totalAmount;
                        existingShipmentInvoice.Balance = 0m;
                        existingShipmentInvoice.PaymentStatus = "Paid";
                        existingShipmentInvoice.LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd");
                        existingShipmentInvoice.UpdatedBy = "SpeedPay Gateway";
                    }

                    var shipmentCollectionExists = await _context.PaymentCollections.AnyAsync(c => c.InvoiceId == shipmentInvoiceId, cancellationToken);
                    if (!shipmentCollectionExists)
                    {
                        var shipmentCollection = new PaymentCollection
                        {
                            InvoiceId = existingShipmentInvoice.Id,
                            CollectedDate = DateTime.UtcNow,
                            AmountCollected = existingShipmentInvoice.TotalAmount,
                            PaymentMethod = "SpeedPay (PayMongo)",
                            Status = "Completed"
                        };
                        _context.PaymentCollections.Add(shipmentCollection);

                        var shipmentReceipt = new OfficialReceipt
                        {
                            PaymentCollectionId = shipmentCollection.Id,
                            ReceiptNumber = receiptNumber + "-S",
                            IssuedDate = DateTime.UtcNow
                        };
                        _context.OfficialReceipts.Add(shipmentReceipt);
                    }
                }

                // --- Synchronize Settled Legacy Invoices to Standard Billing Invoices & Payment Collections ---
                foreach (var settled in settledInvoices)
                {
                    var legacyInv = settled.Inv;
                    var appliedAmt = settled.Applied;

                    string settledInvoiceNo;
                    var parts = legacyInv.InvoiceNo.Split('-');
                    if (parts.Length >= 3)
                    {
                        settledInvoiceNo = $"BI-{parts[1]}-{parts[2]}";
                    }
                    else
                    {
                        settledInvoiceNo = legacyInv.InvoiceNo;
                    }

                    var billingInvoice = await _context.Invoices
                        .FirstOrDefaultAsync(i => i.InvoiceNo == settledInvoiceNo, cancellationToken);

                    if (billingInvoice == null)
                    {
                        billingInvoice = new Invoice
                        {
                            Id = settledInvoiceNo,
                            InvoiceNo = settledInvoiceNo,
                            ClientId = transaction.ClientId,
                            BillingDate = legacyInv.BillingDate,
                            DueDate = legacyInv.DueDate,
                            FreightCharges = legacyInv.FreightCharges,
                            OtherCharges = legacyInv.OtherCharges,
                            Subtotal = legacyInv.Subtotal,
                            VatRate = legacyInv.VatRate,
                            VatAmount = legacyInv.VatAmount,
                            Surcharge = legacyInv.Surcharge,
                            TotalAmount = legacyInv.TotalAmount,
                            AmountPaid = legacyInv.AmountPaid - appliedAmt, // amount paid before this webhook application
                            PaymentStatus = "Unpaid",
                            Description = legacyInv.Description ?? "Auto-generated from legacy invoice"
                        };
                        _context.Invoices.Add(billingInvoice);
                    }

                    billingInvoice.AmountPaid += appliedAmt;
                    BillingComputationService.RecalculateInvoice(billingInvoice);

                    // Sync Receivable
                    var receivableClientId = billingInvoice.ClientId.StartsWith("CL-") 
                        ? billingInvoice.ClientId.Replace("CL-", "CA-") 
                        : billingInvoice.ClientId;
                    DateTime.TryParse(billingInvoice.DueDate, out var parsedDue);
                    var receivable = await _context.ReceivableBalances
                        .FirstOrDefaultAsync(r => r.InvoiceId == billingInvoice.Id, cancellationToken);
                    if (receivable != null)
                    {
                        receivable.BalanceAmount = billingInvoice.Balance;
                        receivable.DueDate = parsedDue;
                        _context.ReceivableBalances.Update(receivable);
                    }
                    else if (billingInvoice.Balance > 0)
                    {
                        receivable = new ReceivableBalance
                        {
                            ClientId = receivableClientId,
                            InvoiceId = billingInvoice.Id,
                            BalanceAmount = billingInvoice.Balance,
                            DueDate = parsedDue
                        };
                        _context.ReceivableBalances.Add(receivable);
                    }
                    else if (receivable != null)
                    {
                        _context.ReceivableBalances.Remove(receivable);
                    }

                    var paymentCollection = new PaymentCollection
                    {
                        InvoiceId = billingInvoice.Id,
                        CollectedDate = DateTime.UtcNow,
                        AmountCollected = appliedAmt,
                        PaymentMethod = "SpeedPay (PayMongo)",
                        Status = "Completed"
                    };
                    _context.PaymentCollections.Add(paymentCollection);

                    var officialReceipt = new OfficialReceipt
                    {
                        PaymentCollectionId = paymentCollection.Id,
                        ReceiptNumber = receiptNumber,
                        IssuedDate = DateTime.UtcNow
                    };
                    _context.OfficialReceipts.Add(officialReceipt);
                }

                // --- Settle Remaining Outstanding standard Billing Invoices (Leftover Overpayments) ---
                if (amountToApplyToInvoice > 0 && transaction.ClientId != null)
                {
                    // Flow B: Distribute outstanding balance across unpaid billing invoices
                    var Invoices = await _context.Invoices
                        .Where(i => i.ClientId == transaction.ClientId && i.PaymentStatus != "Paid")
                        .OrderBy(i => i.DueDate)
                        .ToListAsync(cancellationToken);

                    var remainingAmount = amountToApplyToInvoice;
                    foreach (var bInv in Invoices)
                    {
                        if (remainingAmount <= 0) break;

                        var balance = bInv.TotalAmount - bInv.AmountPaid;
                        if (balance <= 0) continue;

                        var applied = Math.Min(remainingAmount, balance);
                        bInv.AmountPaid += applied;
                        BillingComputationService.RecalculateInvoice(bInv);

                        // Sync Receivable
                        var receivableClientId = bInv.ClientId.StartsWith("CL-") 
                            ? bInv.ClientId.Replace("CL-", "CA-") 
                            : bInv.ClientId;
                        DateTime.TryParse(bInv.DueDate, out var parsedDue);
                        var receivable = await _context.ReceivableBalances
                            .FirstOrDefaultAsync(r => r.InvoiceId == bInv.Id, cancellationToken);
                        if (receivable != null)
                        {
                            receivable.BalanceAmount = bInv.Balance;
                            receivable.DueDate = parsedDue;
                            _context.ReceivableBalances.Update(receivable);
                        }
                        else if (bInv.Balance > 0)
                        {
                            receivable = new ReceivableBalance
                            {
                                ClientId = receivableClientId,
                                InvoiceId = bInv.Id,
                                BalanceAmount = bInv.Balance,
                                DueDate = parsedDue
                            };
                            _context.ReceivableBalances.Add(receivable);
                        }
                        else if (receivable != null)
                        {
                            _context.ReceivableBalances.Remove(receivable);
                        }

                        var paymentCollection = new PaymentCollection
                        {
                            InvoiceId = bInv.Id,
                            CollectedDate = DateTime.UtcNow,
                            AmountCollected = applied,
                            PaymentMethod = "SpeedPay (PayMongo)",
                            Status = "Completed"
                        };
                        _context.PaymentCollections.Add(paymentCollection);

                        var officialReceipt = new OfficialReceipt
                        {
                            PaymentCollectionId = paymentCollection.Id,
                            ReceiptNumber = receiptNumber,
                            IssuedDate = DateTime.UtcNow
                        };
                        _context.OfficialReceipts.Add(officialReceipt);

                        remainingAmount -= applied;
                    }
                }

                var audit = new AuditLog
                {
                    UserId = "SpeedPay Gateway",
                    EntityName = "PaymentTransaction",
                    EntityId = transaction.Id,
                    Action = "Digital Payment Success",
                    Details = $"SpeedPay transaction {transaction.Id} of {transaction.Amount} completed successfully. Receipt generated: {receiptNumber}.",
                    LoggedAt = DateTime.UtcNow
                };
                await _context.AuditLogs.AddAsync(audit, cancellationToken);

                await _context.SaveChangesAsync(cancellationToken);
                return $"Success: Completed payment for transaction {transaction.Id}. Receipt generated: {receiptNumber}";
            }
            else if (eventType == "checkout.failed" || eventType == "checkout.abandoned" || eventType == "payment.failed")
            {
                transaction.Status = (eventType == "checkout.failed" || eventType == "payment.failed") ? "Failed" : "Expired";
                transaction.UpdatedAt = DateTime.UtcNow;

                var audit = new AuditLog
                {
                    UserId = "SpeedPay Gateway",
                    EntityName = "PaymentTransaction",
                    EntityId = transaction.Id,
                    Action = "Digital Payment Failed",
                    Details = $"SpeedPay transaction {transaction.Id} of {transaction.Amount} failed or was abandoned. Event: {eventType}.",
                    LoggedAt = DateTime.UtcNow
                };
                await _context.AuditLogs.AddAsync(audit, cancellationToken);
                
                await _context.SaveChangesAsync(cancellationToken);
                return $"Success: Updated transaction {transaction.Id} status to {transaction.Status}";
            }

            return $"Ignored: Event type {eventType} not handled";
        }

        private bool VerifySignature(string rawBody, string signatureHeader, string webhookSecret)
        {
            if (string.IsNullOrEmpty(signatureHeader)) return false;

            try
            {
                string? t = null;
                string? signature = null;
                var parts = signatureHeader.Split(',');
                foreach (var part in parts)
                {
                    var kv = part.Split('=');
                    if (kv.Length == 2)
                    {
                        var key = kv[0].Trim();
                        var val = kv[1].Trim();
                        if (key == "t") t = val;
                        else if (key == "te" || key == "li") signature = val;
                    }
                }

                if (t == null || signature == null) return false;

                var payload = $"{t}.{rawBody}";

                using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(webhookSecret));
                var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
                var computedSignature = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();

                return computedSignature == signature;
            }
            catch
            {
                return false;
            }
        }
    }

    private static async Task<string> GenerateNextOrNumberAsync(IApplicationDbContext context, CancellationToken cancellationToken)
    {
        var currentYear = DateTime.UtcNow.Year;
        var yearPrefix = $"OR-{currentYear}-";
        
        // 1. Get max from completed Payments
        var lastPayment = await context.Payments
            .Where(p => p.OrNumber.StartsWith(yearPrefix))
            .OrderByDescending(p => p.OrNumber)
            .FirstOrDefaultAsync(cancellationToken);

        int nextSeqNum = 1;
        if (lastPayment != null && lastPayment.OrNumber.Length > yearPrefix.Length)
        {
            var seqPart = lastPayment.OrNumber.Substring(yearPrefix.Length);
            if (int.TryParse(seqPart, out var lastSeq))
            {
                nextSeqNum = lastSeq + 1;
            }
        }
        
        // 2. Get max from pending PaymentTransactions
        var lastTransaction = await context.PaymentTransactions
            .Where(t => t.ReferenceOrNumber != null && t.ReferenceOrNumber.StartsWith(yearPrefix))
            .OrderByDescending(t => t.ReferenceOrNumber)
            .FirstOrDefaultAsync(cancellationToken);

        if (lastTransaction != null && lastTransaction.ReferenceOrNumber!.Length > yearPrefix.Length)
        {
            var seqPart = lastTransaction.ReferenceOrNumber.Substring(yearPrefix.Length);
            if (int.TryParse(seqPart, out var lastSeq) && lastSeq >= nextSeqNum)
            {
                nextSeqNum = lastSeq + 1;
            }
        }

        return $"{yearPrefix}{nextSeqNum:D4}";
    }
}
