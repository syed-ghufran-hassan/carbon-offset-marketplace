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

;; Cancel a listing (seller only)
(define-public (cancel-listing (token-id uint))
  (let ((listing (map-get? listings token-id)))
    (begin
      (asserts! (is-some listing) (err u400))
      (asserts! (is-eq (unwrap! listing (err u401)).seller tx-sender) (err u402))
      (map-delete listings token-id)
      (ok token-id))))

;; Update listing price (seller only)
(define-public (update-listing (token-id uint) (new-price uint))
  (let ((listing (map-get? listings token-id)))
    (begin
      (asserts! (is-some listing) (err u403))
      (asserts! (is-eq (unwrap! listing (err u404)).seller tx-sender) (err u405))
      (asserts! (map-set listings token-id {seller: tx-sender, price: new-price}) (err u406))
      (ok token-id))))
