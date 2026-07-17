# Social Provisioning Approval Gates

Founder approval is required before each transition:

1. `not_tested -> rehearsed`
2. `rehearsed -> ready_for_manual_signup`
3. `ready_for_manual_signup -> founder_opened_platform`
4. `founder_opened_platform -> founder_completed_identity_and_terms`
5. `founder_completed_identity_and_terms -> account_exists_unverified`
6. `account_exists_unverified -> verified_live`
7. `verified_live -> connector_requested`
8. `connector_requested -> connector_authorized`
9. `connector_authorized -> publishing_enabled`

The implemented lab covers only rehearsal and stops at `human_required`. Every later state is documentation for future official integrations and must not be represented as implemented.
