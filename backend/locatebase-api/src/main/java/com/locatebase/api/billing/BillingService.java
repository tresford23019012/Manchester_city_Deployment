package com.locatebase.api.billing;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.NotFoundException;
import com.locatebase.api.guesthouse.Guesthouse;
import com.locatebase.api.guesthouse.GuesthouseRepository;
import com.locatebase.api.user.AppUser;
import com.locatebase.api.user.AppUserRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

// Marking a guesthouse "overdue" never suspends it. Suspension is a separate, deliberate admin action.
@Service
public class BillingService {

    private static final ZoneId BOTSWANA = ZoneId.of("Africa/Gaborone");

    private final PaymentRepository payments;
    private final GuesthouseRepository guesthouses;
    private final AppUserRepository users;

    public BillingService(PaymentRepository payments, GuesthouseRepository guesthouses, AppUserRepository users) {
        this.payments = payments;
        this.guesthouses = guesthouses;
        this.users = users;
    }

    public PaymentResponse get(String guesthouseId) {
        Guesthouse g = find(guesthouseId);
        List<PaymentResponse.Entry> history = payments.findTop24ByGuesthouseIdOrderByCreatedAtDesc(guesthouseId)
                .stream().map(PaymentResponse.Entry::from).toList();
        String status = history.isEmpty() ? "paid" : history.get(0).status();
        return new PaymentResponse(guesthouseId, g.getPricePerNight(), status, history);
    }

    // Adds a new entry to the history for the current month
    public PaymentResponse record(String guesthouseId, PaymentRequest in, Jwt jwt) {
        Guesthouse g = find(guesthouseId);

        String status = in.status().trim().toLowerCase();
        if (!status.equals("paid") && !status.equals("overdue")) {
            throw new BadRequestException("status must be 'paid' or 'overdue'");
        }

        Payment p = new Payment();
        p.setGuesthouseId(guesthouseId);
        p.setMonth(YearMonth.now(BOTSWANA).toString());
        p.setStatus(status);
        p.setAmount(g.getPricePerNight());   // one night's base price, not a promotional price
        p.setNote(in.note() == null || in.note().isBlank() ? null : in.note().trim());
        p.setRecordedBy(users.findByFirebaseUid(jwt.getSubject()).map(AppUser::getName).orElse("admin"));
        p.setCreatedAt(Instant.now());
        payments.save(p);

        return get(guesthouseId);
    }

    private Guesthouse find(String id) {
        return guesthouses.findById(id)
                .orElseThrow(() -> new NotFoundException("Guesthouse not found: " + id));
    }
}