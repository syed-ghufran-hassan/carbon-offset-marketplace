;; ==========================
;; Marketplace Listings
;; ==========================

;; Map to store active listings for sale
;; key: token-id (uint)
;; value: record containing:
;;   - seller: principal who listed the token
;;   - price: price in microSTX
(define-map listings
  uint ;; Token ID
  {seller: principal, price: uint}) ;; Price in microSTX

;; ==========================
;; List a carbon credit NFT for sale
;; ==========================
;; token-id: the token being listed
;; price: price in microSTX (must be > 0)
(define-public (list-for-sale (token-id uint) (price uint))
  (let (
    ;; Call the CarbonCredits contract to get current owner
    (owner-opt-opt (contract-call? .CarbonCredits get-owner token-id))
  )
    (let ((owner-opt (unwrap! owner-opt-opt (err u203)))) ;; Ensure response exists
      (let ((owner (unwrap! owner-opt (err u204)))) ;; Extract the owner principal
        (begin
          ;; Validate price is greater than 0
          (asserts! (> price u0) (err u999))  ;; u999 = invalid price
          ;; Ensure caller is the token owner
          (asserts! (is-eq owner tx-sender) (err u200))
          ;; Insert listing into the map
          (asserts! (map-insert listings token-id {seller: tx-sender, price: price}) (err u201))
          ;; Return token ID on success
          (ok token-id)
        )
      )
    )
  )
)

;; ==========================
;; Get details of a listing
;; ==========================
;; token-id: the token being queried
(define-read-only (get-listing (token-id uint))
  ;; Returns listing record if exists, else none
  (map-get? listings token-id))

;; ==========================
;; Cancel a listing (seller only)
;; ==========================
;; token-id: the token listing to cancel
(define-public (cancel-listing (token-id uint))
  (let ((listing-opt (map-get? listings token-id))) ;; Fetch listing
    (begin
      (asserts! (is-some listing-opt) (err u400)) ;; Ensure listing exists
      (let ((listing (unwrap! listing-opt (err u401))))
        ;; Ensure caller is the seller
        (asserts! (is-eq (get seller listing) tx-sender) (err u402))
        ;; Remove listing from map
        (map-delete listings token-id)
        ;; Return token ID on success
        (ok token-id)
      )
    )
  )
)

;; ==========================
;; Update listing price (seller only)
;; ==========================
;; token-id: the token being updated
;; new-price: new price in microSTX (must be > 0)
(define-public (update-listing (token-id uint) (new-price uint))
  (let ((listing-opt (map-get? listings token-id))) ;; Fetch listing
    (begin
      (asserts! (is-some listing-opt) (err u403)) ;; Ensure listing exists
      (let ((listing (unwrap! listing-opt (err u404))))
        ;; Ensure caller is the seller
        (asserts! (is-eq (get seller listing) tx-sender) (err u405))
        ;; Validate new price is greater than 0
        (asserts! (> new-price u0) (err u998))  ;; u998 = invalid new price
        ;; Update listing price
        (asserts! (map-set listings token-id {seller: tx-sender, price: new-price}) (err u406))
        ;; Return token ID on success
        (ok token-id)
      )
    )
  )
) 

;;Remove a token from the listings map.
(define-public (delist-token (token-id uint))
  (begin
    (asserts! (is-some (map-get? listings token-id)) (err u300)) ;; Make sure token is listed
    (map-delete listings token-id)
    (ok true)
  )
)
