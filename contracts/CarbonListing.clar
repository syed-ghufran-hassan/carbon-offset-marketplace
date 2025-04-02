(define-map listings
  uint ;; Token ID
  {seller: principal, price: uint}) ;; Price in microSTX

;; List carbon credit for sale
(define-public (list-for-sale (token-id uint) (price uint))
  (let ((owner (contract-call? .CarbonCredits get-token-owner token-id)))
    (begin
      (asserts! (is-eq owner tx-sender) (err u200))
      (asserts! (map-insert listings token-id {seller: tx-sender, price: price}) (err u201))
      (ok token-id)))))

;; Get listing details
(define-read-only (get-listing (token-id uint))
  (map-get? listings token-id))
