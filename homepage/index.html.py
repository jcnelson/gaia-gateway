#!/usr/bin/env python2

SCRIPTS = [
    "jquery.min.js",
    "bootstrap.min.js",
]

CSS_PATHS = [
    "bootstrap.min.css",
    'gaia-gateway.css'
]

def attrs(**kw):
    for k in kw:
        assert '"' not in kw[k]

    kwstr = " ".join('{}="{}"'.format(k.strip('_'), kw[k]) for k in kw)
    return kwstr

def table(body, **kw):
    kwstr = attrs(**kw)
    return "<table {}>{}</table>".format(kwstr, body)

def tr(body, **kw):
    kwstr = attrs(**kw)
    return "<tr {}>{}</tr>".format(kwstr, body)

def td(body, **kw):
    kwstr = attrs(**kw)
    return "<td {}>{}</td>".format(kwstr, body)

def div(body, **kw):
    kwstr = attrs(**kw)
    return "<div {}>{}</div>".format(kwstr, body)

def span(body, **kw):
    kwstr = attrs(**kw)
    return "<span {}>{}</span>".format(kwstr, body)

def ol(body, **kw):
    kwstr = attrs(**kw)
    return '<ol {}>{}</ol>'.format(kwstr, body)

def ul(body, **kw):
    kwstr = attrs(**kw)
    return '<ul {}>{}</ul>'.format(kwstr, body)

def li(body, **kw):
    kwstr = attrs(**kw)
    return '<li {}>{}</li>'.format(kwstr, body)

def p(body, **kw):
    kwstr = attrs(**kw)
    return '<p {}>{}</p>'.format(kwstr, body)

def form(action, method, body, **kw):
    kwstr = attrs(**kw)
    return '<form action="{}" method="{}" {}>{}</form>'.format(action, method, kwstr, body)

def label(name, _for, **kw):
    kwstr = attrs(**kw)
    return '<label for="{}" {}>{}</label>'.format(_for, kwstr, name)

def textinput(name, default, **kw):
    kwstr = attrs(**kw)
    return '<input type="text" name="{}" default="{}" {}/>'.format(name, default, kwstr)

def submit(value, **kw):
    kwstr = attrs(**kw)
    assert '"' not in value
    return '<button type="submit" {}>{}</button>'.format(kwstr, value)


hostname = 'gateway.gaia-storage.com'

gaia_gateway_homepage = \
    div(
        p('This is a Gaia gateway.  It lets you download files from <a href="https://github.com/blockstack/gaia">Gaia</a>, a high-performance decentralized storage system used by <a href="https://blockstack.org">Blockstack</a>.') +
        p('Gaia is made up of one or more <a href="https://github.com/blockstack/gaia">Gaia hubs</a>.  A user runs a Gaia hub to store their data, and uses a discovery protocol like ' + \
            '<a href="https://github.com/blockstack/blockstack-core/blob/master/docs/blockstack_naming_service.md">BNS</a> to look up and authenticate other users\' Gaia hubs.') +
        p('<b>Reading Files</b>') +
        p('All files in Gaia are addressed by a user identifier, an application\'s hostname, and a filename.<br>To read a file, construct a URL path as <code>/{{bnsName}}/{{applicationHost}}/{{filename}}</code>') +
        p(ul(li('Example: <a href="https://{}/ryan.id/publik.ykliao.com/statuses.json">https://{}/ryan.id/publik.ykliao.com/statuses.json</a>'.format(hostname, hostname)))) +
        p('The code for this Gaia gateway can be found <a href="https://github.com/jcnelson/gaia-gateway">here</a>.  Anyone can run and host their own Gaia gateway.') +
        p('<b>Listing Files in a Gaia Hub</b>') +
        p('Gaia hubs do not allow anyone but their owner to list files.  This gateway cannot list files even if it wanted to.') +
        p('<b>Listing Gaia Hubs</b>') +
        p('Each BNS name is bound to a signed list of application URLs and the Gaia hub the name owner uses to serve their application-specific data.<br>You can get this information with the URL path <code>/{{bnsName}}</code>') +
        p(ul(li('Example: <a href="https://{}/ryan.id">https://{}/ryan.id</a>'.format(hostname, hostname)))) +
        p('<b>Listing BNS Names</b>') +
        p('You can use a <a href="https://github.com/blockstack/blockstack-core">Blockstack Core</a> node to enumerate all BNS names.  A public node is available <a href="https://core.blockstack.org">here</a>.')
    )

main_body = div(
                div(
                    div(
                        div('<b>Gaia Gateway (beta)</b>', _class='code panel-heading panel-heading-custom') +
                        div(gaia_gateway_homepage, _class='panel-body'),
                    _class='panel panel-default'),
                _class='panel-group'),
            _class='container')

panel = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n'
panel += "<html lang=\"en\"><head><title>Gaia Gateway (beta)</title>"

for s in CSS_PATHS:
    panel += '<link rel="stylesheet" href="{}">'.format(s)

for s in SCRIPTS:
    panel += '<script type="text/javascript" src="{}"></script>'.format(s)

panel += "</head><body>" + main_body + "</body></html>"

print panel
