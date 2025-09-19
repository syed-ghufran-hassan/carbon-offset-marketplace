;; ==========================
;; Purchase a carbon credit NFT
;; ==========================
;; token-id: the carbon credit token being purchased
(define-public (buy-carbon-credit (token-id uint))
  (let ((listing (map-get? .CarbonListing listings token-id))) ;; Fetch listing details
    (begin
      ;; Ensure the token is listed for sale
      (asserts! (is-some listing) (err u300)) ;; u300 = listing does not exist

      ;; Extract seller and price from the listing
      (let ((seller (unwrap! listing (err u301)).seller)
            (price  (unwrap! listing (err u302)).price))

        ;; ==========================
        ;; Transfer STX from buyer to seller
        ;; ==========================
        ;; tx-sender is the buyer
        (try! (stx-transfer? price tx-sender seller))

        ;; ==========================
        ;; Transfer NFT ownership in the CarbonCredits contract
        ;; ==========================
        ;; Calls the transfer function in the CarbonCredits contract
        ;; token ownership moves from seller to buyer
        (try! (contract-call? .CarbonCredits transfer-carbon-credit token-id tx-sender))

        ;; ==========================
        ;; Remove the listing after successful purchase
        ;; ==========================
        (map-delete .CarbonListing listings token-id)

        ;; Return token ID as confirmation of purchase
        (ok token-id)
      )
    )
  )
)
