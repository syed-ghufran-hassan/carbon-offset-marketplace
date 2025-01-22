;; CarbonCredits.clar
;; SIP-009 NFT implementation for tokenized carbon credits.

(use-trait sip-009-nft-trait .sip-009-nft-trait)

(define-non-fungible-token carbon-credit {id: uint, project: (string-utf8 50), location: (string-utf8 50), metric-ton: uint, retired: bool})

(define-map token-owners
  uint ;; Token ID
  principal) ;; Token Owner

(define-map token-metadata
  uint ;; Token ID
  {project: (string-utf8 50), location: (string-utf8 50), metric-ton: uint, retired: bool}) ;; Metadata

(define-data-var next-token-id uint 1)

(define-public (mint-carbon-credit (project (string-utf8 50)) (location (string-utf8 50)) (metric-ton uint))
  (let ((token-id (var-get next-token-id)))
    (begin
      ;; Mint the token
      (asserts! (map-insert token-owners token-id tx-sender) (err u100))
      (asserts! (map-insert token-metadata token-id {project: project, location: location, metric-ton: metric-ton, retired: false}) (err u101))
      
      ;; Update the token counter
      (var-set next-token-id (+ token-id u1))
      (ok token-id))))

(define-public (transfer-carbon-credit (token-id uint) (recipient principal))
  (let ((owner (map-get? token-owners token-id)))
    (begin
      (match owner
        value
        (asserts! (is-eq value tx-sender) (err u102))
        (asserts! (map-set token-owners token-id recipient) (err u103)))
      (ok token-id))))

(define-public (retire-carbon-credit (token-id uint))
  (let ((owner (map-get? token-owners token-id))
        (metadata (map-get? token-metadata token-id)))
    (begin
      (asserts! (is-some owner) (err u104))
      (asserts! (is-eq (unwrap! owner (err u105)) tx-sender) (err u106))
      (asserts! (is-some metadata) (err u107))

      ;; Update the metadata to mark as retired
      (asserts! (map-set token-metadata token-id 
        (merge 
          (unwrap! metadata (err u108))
          {retired: true})) (err u109))
      (ok token-id))))

(define-read-only (get-token-metadata (token-id uint))
  (unwrap! (map-get? token-metadata token-id) (err u110)))

(define-read-only (get-token-owner (token-id uint))
  (unwrap! (map-get? token-owners token-id) (err u111)))
