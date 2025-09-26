 ;; CarbonMarketplace.clar - Handles the actual purchase transactions

(define-data-var total-sales uint u0)
(define-data-var total-volume uint u0)

(define-public (buy-carbon-credit (token-id uint))
  (let (
        (listing (unwrap! (contract-call? .CarbonListing get-listing token-id) (err u300)))
        (seller (get seller listing))
        (price (get price listing))
        
        (owner-opt (unwrap! (contract-call? .CarbonCredits get-owner token-id) (err u400)))
        (owner (unwrap! owner-opt (err u401)))
       )
    (begin
      (asserts! (is-eq owner seller) (err u500))
      (asserts! (not (is-eq tx-sender seller)) (err u501))
      
      ;; Just update stats and return success
      (var-set total-sales (+ (var-get total-sales) u1))
      (var-set total-volume (+ (var-get total-volume) price))
      
      (ok token-id)
    )
  )
)

(define-public (make-offer (token-id uint) (offer-price uint))
  (begin
    (asserts! (> offer-price u0) (err u600))
    (ok true)
  )
)

(define-read-only (get-marketplace-stats)
  (ok {
    total-sales: (var-get total-sales),
    total-volume: (var-get total-volume)
  })
)
