(use-trait sip-009-nft-trait .sip-009-nft-trait)

(define-non-fungible-token carbon-credit 
  {id: uint, project: (string-utf8 50), location: (string-utf8 50), metric-ton: uint, retired: bool})

(define-map token-owners uint principal)  ;; Maps Token ID to Owner
(define-map token-metadata uint {project: (string-utf8 50), location: (string-utf8 50), metric-ton: uint, retired: bool})

(define-data-var next-token-id uint 1)

;; Mint a new carbon credit NFT
(define-public (mint-carbon-credit (project (string-utf8 50)) (location (string-utf8 50)) (metric-ton uint))
  (let ((token-id (var-get next-token-id)))
    (begin
      (asserts! (map-insert token-owners token-id tx-sender) (err u100))
      (asserts! (map-insert token-metadata token-id {project: project, location: location, metric-ton: metric-ton, retired: false}) (err u101))
      (var-set next-token-id (+ token-id u1))
      (ok token-id)))))

;; Transfer ownership of carbon credit
(define-public (transfer-carbon-credit (token-id uint) (recipient principal))
  (let ((owner (map-get? token-owners token-id)))
    (begin
      (asserts! (is-some owner) (err u102))
      (asserts! (is-eq (unwrap! owner (err u103)) tx-sender) (err u104))
      (asserts! (map-set token-owners token-id recipient) (err u105))
      (ok token-id)))))

;; Retrieve token metadata
(define-read-only (get-token-metadata (token-id uint))
  (unwrap! (map-get? token-metadata token-id) (err u110)))

;; Retrieve token owner
(define-read-only (get-token-owner (token-id uint))
  (unwrap! (map-get? token-owners token-id) (err u111)))
