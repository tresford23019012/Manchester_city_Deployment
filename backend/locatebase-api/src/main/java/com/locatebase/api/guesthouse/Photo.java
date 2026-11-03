package com.locatebase.api.guesthouse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

//Represents a photo associated with a guesthouse, including the publid ID and Url of the photo

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Photo {
    private String publicId;
    private String url;
}
