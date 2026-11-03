package com.locatebase.api.guesthouse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

// An owner's promotion, stored inside the guesthouse. A guesthouse has at most one.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Promotion {
    private String title;

    // 1 to 100
    private int discountPercent;   

    // after this moment the promotion stops showing
    private Instant validUntil;  
      
    // An expired promotion simply stops matching, so no clean-up job is needed
    public boolean isRunning(Instant now) {
        return validUntil == null || validUntil.isAfter(now);
    }
}
