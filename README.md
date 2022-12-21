# Cloudflare MTA-STS Worker

**One MTA-STS Worker "to rule them all"!**

*This worker is based on [this worker](https://gist.github.com/Tugzrida/61235545dfc122262c69b0ab50265582) and has some code from [this worker](https://github.com/nikhiljohn10/ddnslab).*

The worker will connect to the Cloudflare API to fetch the MX records for the zone and return a MTA-STS policy with all MX records included.

## Usage
Configure the worker and add a [Custom Domain trigger](https://developers.cloudflare.com/workers/platform/triggers/custom-domains/) for *mta-sts.yourdomain.tld*. Don't forget to add a *_mta-sts.yourdomain.tld* TXT record, or use CNAMES to point all domains to a single TXT record!

## Configuration variables
### cfApiToken
The variable cfApiToken must be defined as (encrypted!) environment variable. See [here](https://developers.cloudflare.com/workers/platform/environment-variables/#environment-variables-via-the-dashboard) on how to add environment variables. Permission required is "DNS Read" on all DNZ zones for which a Custom Domain trigger has been created.
### stsMode
The stsMode constant defines the policy "mode" and can be 'enforce', 'testing' or 'none'. See the [SMTP MTA Strict Transport Security (MTA-STS)](https://www.rfc-editor.org/rfc/rfc8461#section-5) RFC for details.
### stsMaxAge
The stsMaxAge constant defines the maximum lifetime (cache) of the MTA-STS policy. Officially there is no minimum value, but 86400 is the recommended minimum value due to some parties (like Google) not processing policies with a value lower than 86400.