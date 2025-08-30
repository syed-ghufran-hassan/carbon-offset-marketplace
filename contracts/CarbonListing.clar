(define-map listings
  uint ;; Token ID
  {seller: principal, price: uint}) ;; Price in microSTX

;; List carbon credit for sale
(define-public (list-for-sale (token-id uint) (price uint))
   
  (let (
    (owner-opt-opt (contract-call? .CarbonCredits get-owner token-id))
  )
    (let ((owner-opt (unwrap! owner-opt-opt (err u203))))
      (let ((owner (unwrap! owner-opt (err u204))))
        (begin
           ;; Check that price is greater than 0
        (asserts! (> price u0) (err u999))  ;; err u999 means invalid price
          (asserts! (is-eq owner tx-sender) (err u200))
          
          (asserts! (map-insert listings token-id {seller: tx-sender, price: price}) (err u201))
          (ok token-id)
        )
      )
    )
  )
)




;; Get listing details
(define-read-only (get-listing (token-id uint))
  (map-get? listings token-id))

;; Cancel a listing (seller only)
(define-public (cancel-listing (token-id uint))
  (let ((listing-opt (map-get? listings token-id)))
    (begin
      (asserts! (is-some listing-opt) (err u400))
      (let ((listing (unwrap! listing-opt (err u401))))
        (asserts! (is-eq (get seller listing) tx-sender) (err u402))
        (map-delete listings token-id)
        (ok token-id)
      )
    )
  )
)

;; Update listing price (seller only)
(define-public (update-listing (token-id uint) (new-price uint))
  (let ((listing-opt (map-get? listings token-id)))
    (begin
      (asserts! (is-some listing-opt) (err u403))
      (let ((listing (unwrap! listing-opt (err u404))))
        (asserts! (is-eq (get seller listing) tx-sender) (err u405))
        ;; Check that new-price is greater than 0
        (asserts! (> new-price u0) (err u998))  ;; err u998 means invalid new price
        (asserts! (map-set listings token-id {seller: tx-sender, price: new-price}) (err u406))
        (ok token-id)
      )
    )
  )
)
