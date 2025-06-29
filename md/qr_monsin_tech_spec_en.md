# Technical Specification: QR-Based Medical Questionnaire System

## 1. System Overview

This document outlines the technical design for a QR-based medical questionnaire system. The system allows patients to complete a questionnaire on their smartphones, encode the data into a QR code locally, and have it scanned and restored at the clinic.

The system consists of two core applications:

1.  **Input App (Public-Facing):** A web-based application that presents the questionnaire form and generates a QR code from the user's input.
2.  **Restore App (Internal):** An intranet-based application used by clinic staff to scan the QR code and restore the questionnaire data.

---

## 2. Application Architecture

### 2.1. Input App (Patient-Facing)

| Item                  | Specification                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| **Deployment**        | Static HTML/JS (SPA) or PWA (future consideration).                                                       |
| **Input Fields**      | Multiple-choice questions (radio, checkbox, dropdowns) and a free-text field (up to 300 characters).      |
| **Data Pipeline**     | Form data is converted to CSV -> Compressed with zlib -> Encrypted with AES -> Encoded into a QR code.    |
| **QR Code Specs**     | ECC Level M, Version auto-selected (max capacity ~2953 bytes).                                            |
| **Security**          | AES-256-CBC encryption. The decryption key is stored exclusively on the internal network.                 |
| **State Management**  | No cookies, LocalStorage, or SessionStorage will be used to ensure data is volatile.                      |
| **Connectivity**      | Primarily offline. A zero-knowledge proof API may be considered for future anonymous logging.             |
| **Supported Devices** | iOS (Safari) and Android (Chrome).                                                                        |

### 2.2. Restore App (Internal)

| Item                | Specification                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| **Environment**     | Deployed on a closed intranet, with no internet access.                                                   |
| **Input Method**    | QR code data is received from a dedicated USB/HID scanner.                                                |
| **Data Pipeline**   | QR code data is read -> Base64 decoded -> zlib decompressed -> AES decrypted -> Parsed as CSV.             |
| **Data Display**    | The decoded information is displayed in the UI in a structured, human-readable format. A "Copy to Clipboard" button is provided. |
| **Security**        | The decryption key is hardcoded locally. All decoded data is held only in volatile in-app memory and is purged from memory and UI upon clicking a "Clear" button. No persistent browser-based storage (e.g., localStorage, sessionStorage, IndexedDB) is used. |

---

## 3. Data Structure

### 3.1. CSV Payload Example

The data is structured as a CSV string before being processed. All fields except for the name and free text are numeric IDs.

```
SatoTaro,1979,03,25,30,1,3;4;6,2,8;1;2,Urgent consultation needed
```

### 3.2. Compression and Encryption Workflow

| Step | Process                               |
| ---- | ------------------------------------- |
| 1    | Generate a UTF-8 CSV string.          |
| 2    | Encode to Shift_JIS.                  |
| 3    | Compress with zlib (pako.js).         |
| 4    | Encrypt with AES (crypto-js).         |
| 5    | Encode to Base64 and generate QR code.|

---

## 4. Security Policy

-   **No Data Transmission:** The patient's questionnaire data is never transmitted from their device.
-   **API Anonymity:** If an external API is used, it will not receive any personal or medical information. Only structured metadata will be sent.
-   **HMAC Signature:** The QR code data can be signed with an HMAC to verify its integrity. The HMAC key is stored only on the restore app.
-   **Data Volatility:** All data is wiped from the patient's device upon closing the page.
-   **Tamper Detection:** The restore app will verify the HMAC signature to detect any tampering.

---

## 5. Design Considerations

1.  **Multiple-Choice Focus:** Prioritize multiple-choice questions to reduce data size and prevent input errors.
2.  **Local Validation:** Implement client-side validation to detect missing inputs or logical inconsistencies.
3.  **Character Normalization:** Normalize all characters to a consistent format (e.g., NFKC).
4.  **Free-Text Limits:** Limit the free-text field to 300 characters and sanitize the input to prevent injection attacks.
5.  **QR Code Readability:** Use a high ECC level (M) and ensure good contrast to prevent scanning issues.
6.  **Threat Model:** In a worst-case scenario, only the encrypted questionnaire data and a signed hash are exposed.
7.  **Key Management:** The decryption key is loaded from environment variables and is never shared.

---

## 6. Future Enhancements

-   **QR Code Expiration:** Implement QR code expiration to prevent reuse.
-   **Zero-Knowledge API:** Introduce a zero-knowledge API for anonymous logging.
-   **System Integration:** Integrate the restore app with other internal systems (e.g., CSV to HL7).
-   **Localization:** The system is currently limited to Japanese.

---

## 7. Network Separation Policy

In development, both `input-app` and `restore-app` may run locally on separate ports (e.g., http://localhost:5173 and http://localhost:5174).

However, in production:

-   The `input-app` must be deployed on a **public-facing external server** (e.g., https://monsin.example.com).
-   The `restore-app` must be deployed **only within the hospital's internal closed network** (intranet), completely isolated from the Internet.

There must be **no direct or indirect communication between these two applications** in the real environment.

This network isolation is critical to maintaining patient privacy, ensuring data integrity, and preventing leakage or injection via any shared infrastructure.

---

## 8. Data Persistence

-   **No Storage:** The application must not use any form of storage, including but not limited to `sessionStorage`, `localStorage`, or `IndexedDB`.
-   **No Logging or Caching:** No logging or file-based caching is permitted.

---

## 9. Implementation Checklist

-   [ ] Form validation (missing input detection).
-   [ ] Character normalization (half-width/full-width).
-   [ ] CSV generation and parsing tests.
-   [ ] zlib compression and Base64 encoding length checks.
-   [ ] QR code readability tests on physical devices.
-   [ ] AES key mismatch handling (error UI).
-   [ ] Tamper detection (HMAC signature mismatch).
-   [ ] API signature verification logic.
