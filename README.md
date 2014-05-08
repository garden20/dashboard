[![Build Status](https://secure.travis-ci.org/garden20/dashboard.png)](http://travis-ci.org/garden20/dashboard)

# Dashboard

The dashboard couchapp gives you a way to make a site out of a bunch of couchapps.

## The Garden Project

An open garden, opposite of a [Walled Garden](http://en.wikipedia.org/wiki/Walled_garden_(technology\) ), is a place for couchapp developers to distribute couchapps.
The name also pays tribute to the [Garden](https://couchapp.org/page/garden) project by J Chris Anderson.

Learn more on the [wiki](https://github.com/kanso/garden/wiki).

## Deploy

```
npm install -g kanso
```

### Development

```
kanso push http://localhost:5984/dashboard
```

### Production

```
kanso push https://example.com/dashboard
```

#### Vhosts

Example `vhosts` section to configure your dashboard to manage your frontpage:

```
{
    "staging.dev.medicmobile.org": "/dashboard/_design/dashboard/_rewrite",
    "staging.dev.medicmobile.org/dashboard": "/dashboard"
}
```

## Travis

When pushed to `master` on github, the application is auto-deployed to
http://staging.dev.medicmobile.org/ and will be available to any existing
dashboards.


