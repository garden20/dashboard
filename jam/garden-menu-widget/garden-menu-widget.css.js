(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.garden_menu_widget_css = factory();
    }
}(this, function () { return {



'#dashboard-topbar' : {

    'font-weight': 'normal',
    'line-height': '18px',
    'color': '#404040',
    'height': '25px',
    'width': '100%',
    'background-color': '#1D1D1D',
    'position': "relative",
    'font-family': "ProximaNovaRgRegular, 'Helvetica Neue', helvetica, arial, sans-serif",
    'font-size': '14px'

},



'#dashboard-topbar .topbar-middle' : {
    'width' : '940px',
    'margin-left': 'auto',
    'margin-right': 'auto'
},

'#dashboard-topbar .topbar-right' : {
    'float': 'right'

},

'#dashboard-topbar a': {
    'text-decoration': 'none',
    'font-weight': 'normal'
},


'#dashboard-topbar ul': {
    'margin': '0',
    'padding': '0',
    'height': '25px',
    'overflow': 'hidden',
    'list-style-type': 'none'

},

'#dashboard-topbar ul>li': {
    'display': 'block',
    'float': 'left'
},

'#dashboard-topbar ul>li>a': {
    'display': 'block',
    'padding': '3px 10px 2px 10px',
    'color': '#BFBFBF',
    'font-weight': 'bold',
    'text-transform': 'capitalize'
},

'#dashboard-topbar ul>li>a:hover': {
    'color': '#FFFFFF',
    'text-decoration': 'none'
},

'#dashboard-topbar ul>li.active>a.active' : {
    'border-top': '2px solid #95B774 !important',
    'color': '#FFF'
},

'#dashboard-topbar-offline-icon' : {
    'cursor': 'pointer',
    'display': 'inline-block',
    'padding': '0 3px',
    'border-left': '1px solid #404040;',
    'width': '21px',
    'height': '21px'
},

'#dashboard-topbar-offline-icon svg' : {
    'position': 'relative',
    'top': '2px',
    'left': '2px'
},

'#dashboard-profile': {
    'display': 'inline-block',
    'padding': '0',
    'border-left': '1px solid #404040;',
    'position': 'relative',
    'top': '-3px'
},

'#dashboard-profile img': {
    'position': 'relative',
    'top': '4px',
    'padding-left': '10px'
},

'#dashboard-profile h4': {
    'display': 'inline-block',
    'margin': '0',
    'position': 'relative',
    'top': '-1px',
    'font-family': '"Helvetica Neue", Helvetica, Arial, sans-serif',
    'font-size': '13px',
    'font-weight': 'normal',
    'line-height': '18px',
    'color': '#BFBFBF',
    'padding-right': '10px'
},


'#dashboard-topbar   a.login': {
    'display': 'block',
    'padding': '2px 10px 2px 10px',
    'color': 'white'
},

'#dashboard-topbar  a.login:hover': {
    'color': '#ccc',
    'text-decoration': 'none'
},

'#dashboard-topbar  a.login': {
    'color': '#ccc',
    'text-decoration': 'none'
}


};  }));