package com.locatebase.api.guesthouse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// The contract groups the three contact details into one block

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Contact {
    private String phone;
    private String whatsapp;
    private String email;
}
