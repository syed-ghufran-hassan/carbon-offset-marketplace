(define-public (buy-carbon-credit (token-id uint))
  (let ((listing (map-get? .CarbonListing listings token-id)))
    (begin
      (asserts! (is-some listing) (err u300))
      (let ((seller (unwrap! listing (err u301)).seller)
            (price (unwrap! listing (err u302)).price))

        ;; Transfer STX to seller
        (try! (stx-transfer? price tx-sender seller))

        ;; Transfer NFT ownership in CarbonCredits contract
        (try! (contract-call? .CarbonCredits transfer-carbon-credit token-id tx-sender))

        ;; Remove from sale
        (map-delete .CarbonListing listings token-id)

        (ok token-id))))))
