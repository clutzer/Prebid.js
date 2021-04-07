# Akamai Data Activation Platform Audience Segment ID Targeting

The Akamai Data Activation Platform (DAP) is a privacy-first system that protects end-user privacy by only allowing them to be targeted as part of a larger cohort.  DAP views hiding invididuals in large crows as the best mechanism to prevent unauthorized tracking.

The integration of DAP into Prebid.JS consists of creating a UserID plugin that interacts with the DAP API.  The UserID module tokenizes the end-user identity into an ephemeral, secure pseudonymization called a DAP token.  The DAP Token is then supplied to the bid-stream where the SSP partner looks up cohort membership for that token, and supplies the cohorts to the rest of the bid-stream.

In this system, no end-user identifier is supplied to the bid-stream, only cohorts.  This is a foundational privacy principle DAP is built upon.

## Onboarding

Please reach out to your Akamai account representative to get provisioned on the DAP platform.

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
        apiHostname: '<see your Akamai account rep>',
        domain: 'your-domain.com',
        type: 'email' | 'mobile' | ... | 'dap-signature:1.0.0'
      },
    }],
    auctionDelay: 50             // 50ms maximum auction delay, applies to all userId modules
  }
});
```

## TODO

This documentation is a work in progress...
