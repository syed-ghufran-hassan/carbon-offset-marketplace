;; Carbon Credit NFT contract without traits

(define-non-fungible-token carbon-credit uint)

;; Maps Token ID to Owner
(define-map token-owners uint principal)

;; Maps Token ID to metadata about the carbon credit
(define-map token-metadata uint
  {
    project: (string-utf8 50),
    location: (string-utf8 50),
    metric-ton: uint,
    retired: bool
  }
)

(define-data-var next-token-id uint u1)

;; Mint a new carbon credit NFT to `to` with metadata
(define-public (mint (to principal) (project (string-utf8 50)) (location (string-utf8 50)) (metric-ton uint))
  (let ((token-id (var-get next-token-id)))
    (begin
      (asserts! (<= (len project) u50) (err u200))
      (asserts! (<= (len location) u50) (err u201))
      (asserts! (> metric-ton u0) (err u202)) ;; Example: ensure metric-ton > 0

      (asserts! (map-insert token-owners token-id to) (err u100))
      (asserts! (map-insert token-metadata token-id {project: project, location: location, metric-ton: metric-ton, retired: false}) (err u101))
      (var-set next-token-id (+ token-id u1))
      (ok token-id)
    )
  )
)

;; Transfer ownership of a carbon credit token
(define-public (transfer (token-id uint) (recipient principal))
  (let ((owner (map-get? token-owners token-id)))
    (begin
      (asserts! (is-some owner) (err u102))
      ;; Only owner can transfer
      (asserts! (is-eq (unwrap! owner (err u103)) tx-sender) (err u104))
      (asserts! (map-set token-owners token-id recipient) (err u105))
      (ok token-id)
    )
  )
)

;; Get owner of a token
(define-read-only (get-owner (token-id uint))
  (ok (map-get? token-owners token-id))
)

;; Get metadata of a token
 (define-read-only (get-token-metadata (token-id uint))
  (match (map-get? token-metadata token-id)
    metadata (ok metadata)
    (err u110)
  )
)

(define-public (update-metadata (token-id uint) (new-metadata {project: (string-utf8 50), location: (string-utf8 50), metric-ton: uint, retired: bool}))
  (let ((owner (map-get? token-owners token-id)))
    (begin
      (asserts! (is-some owner) (err u106))
      ;; Only the owner can update metadata
      (asserts! (is-eq (unwrap! owner (err u107)) tx-sender) (err u108))
      (asserts! (map-set token-metadata token-id new-metadata) (err u109))
      (ok true)
    )
  )
)


