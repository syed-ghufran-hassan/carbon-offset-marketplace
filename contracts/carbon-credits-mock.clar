;; contracts/carbon-credits-mock.clar

(impl-trait .carbon-credits-trait)

;; Always fails transfers
(define-public (transfer-carbon-credit (token-id uint) (recipient principal))
  (err u999))

;; Mock mint function for testing
(define-public (mint-mock-token (owner principal))
  (begin
    (map-set token-owners u1 owner)
    (ok true)))

;; Mock owner lookup
(define-read-only (get-token-owner (token-id uint))
  (map-get? token-owners token-id))

;; Storage for mock
(define-map token-owners uint principal)
