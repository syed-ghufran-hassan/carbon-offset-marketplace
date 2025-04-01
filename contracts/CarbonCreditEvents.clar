;; Event emissions for important actions
(define-data-event Minted
  (token-id uint)
  (project (string-utf8 50))
  (amount uint)
)

(define-data-event Retired
  (token-id uint)
  (by principal)
  (purpose (string-utf8 100))
)

(define-data-event Listed
  (token-id uint)
  (price uint)
  (seller principal)
)

(define-data-event Purchased
  (token-id uint)
  (from principal)
  (to principal)
  (price uint)
)
