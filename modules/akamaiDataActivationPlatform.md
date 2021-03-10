# Akamai Data Activation Platform Audience Segment ID Targeting

Akamai Data Activation Platform (DAP) is a system that allows Advertisers to reach intended audiences, and protects end-user privacy on Publisher sites by grouping individuals into large audience segments.  The Prebid UserID module integration utilizies an ephemeral token for the ID as opposed to a persistent, deterministic ID to help ensure privacy.  The ephemeral token is then used to lookup audience segment membership throughout the end-user's engagement with the web property.

## Onboarding

Please reach out to your Akamai sales representative to get provided on the DAP platform.

## DAP Configuration

First, make sure to add the DAP submodule to your Prebid.js package with:

```
gulp build --modules=akamaiDataActivationPlatform,userId
```

The following configuration parameters are available:

```javascript
pbjs.setConfig({
  userSync: {
    userIds: [{
      name: 'akamaiDataActivationPlatform',
      params: {
        type: dap-signature | email | mobile | ...
      },
      storage: {
        type: 'html5',           // "html5" is the required storage type
        name: 'akamaiDapId',     // "akamaiDapid" is the required storage name
        expires: 90,             // storage lasts for 90 days
        refreshInSeconds: 30     // refresh ID every 30 seconds to ensure ephemeralness
                                 // TODO: can refresh be triggered by a page load?
      }
    }],
    auctionDelay: 50             // 50ms maximum auction delay, applies to all userId modules
  }
});
```

## TODO

Complete this documentation.
