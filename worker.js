const stsMode = 'enforce' // enforce, testing, or none
const stsMaxAge = 86400 // max value: 31557600 (1 year), min recommended value: 86400 (1 day). 

const stsPolicy = `version: STSv1
mode: ${stsMode}
mx: %{MX}
max_age: ${stsMaxAge}
`
const cfApiBase = 'https://api.cloudflare.com/client/v4/'
const jsonType = 'application/json;charset=UTF-8'
const respHeaders = {"Content-Type": "text/plain;charset=UTF-8"}

async function handleRequest(request) {
  const reqUrl = new URL(request.url)

  if (!reqUrl.hostname.startsWith("mta-sts.")) {
      return new Response(`Incorrect worker route. mta-sts policies must be served on the mta-sts subdomain\n`, {status: 500, headers: respHeaders})
  }

  if (reqUrl.protocol !== "https:" || reqUrl.pathname !== "/.well-known/mta-sts.txt") {
    reqUrl.protocol = "https:"
    reqUrl.pathname = "/.well-known/mta-sts.txt"
    return Response.redirect(reqUrl, 301)
  }

  const zonename = reqUrl.hostname.slice(8)

  result = await getZoneID(zonename, cfApiToken)
  if (!result.success) {
    return new Response(`Zone ${zonename} is not found or inaccessible\n`, {status: 500, headers: respHeaders})
  }

  result = await getMailServers(result.zoneID, cfApiToken)
  if (!result.success) {
    return new Response(`No MX records found for ${zonename}\n`, {status: 500, headers: respHeaders})
  }

  return new Response(stsPolicy.replace("%{MX}", result.mailServers.join("\nmx: ")), {status: 200, headers: respHeaders})
}

async function getZoneID(zname, auth) {
  try {
    const url = cfApiBase + 'zones?name=' + zname
    const init = {
    headers: {
        'content-type': jsonType,
        'authorization': 'Bearer ' + auth,
    },
    }
    const response = await fetch(url, init)
    const results = await response.json()
    if ((results.result).length) {
    return { "success": true, "zoneID": results.result[0].id }
    } else {
    return { "success": false, "error": "No zone found" }
    }
  } catch (err) {
    return { "success": false, "error": "No zone found" }
  }
}

async function getMailServers(zid, auth) {
  try {
    const url = cfApiBase + 'zones/' + zid + '/dns_records?type=MX'
    const init = {
      headers: {
        'content-type': jsonType,
        'authorization': 'Bearer ' + auth,
      },
    }
    const response = await fetch(url, init)
    const results = await response.json()

    if ((results.result).length) {
      return { "success": true, "mailServers": results.result.map(s => s.content) }
    } else {
      return { "success": false, "error": "No record found" }
    }
  } catch (err) {
    return { "success": false, "error": "No record found" }
  }
}

async function getZonName(name) {
  const arr = name.split('.').reverse()
  while (arr.length > 2) {
    arr.pop()
  }
  return arr.reverse().join('.')
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})