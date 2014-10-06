/*!
 * Ext.ux.GoogleAnalytics
 * http://github.com/ahj/Ext.ux.Analytics
 *
 * Copyright 2014 Alun Huw Jones
 * Released under the MIT license
 * Check MIT-LICENSE.txt
 */
 /*
 * @coauthor Kyle Paul
 * @class  Ext.ux.GoogleAnalytics
 * @extend Ext.app.Controller
 * Enables Google Analytics integration for Ext JS 4 MVC architecture.
 * 
 * Adapted from the ExtJS Google Analytics library made by Alun Huw Jones
 * http://github.com/ahj/Ext.ux.Analytics
 * 
 * - updated for use with Google Universal Analytics
 * - added ability to track virtual pageviews
 * - enhanced ability to track events
 * - added ability to enable 'forceSSL' mode
 * - added ability to enable 'debugMode'
 * 
 * @example
 *      Ext.application({
 *          name: 'MyApp',
 *          ...
 *          paths: {
 *              'Ext.ux': 'app/ux'
 *          },
 *          GoogleAnalytics: {
 *              trackingCode: 'your tracking code', // 'UA-XXXX-Y'
 *              forceSSL: true // (optional boolean) Send all data using SSL, even from insecure (HTTP) pages.
 *              debugMode: true, // (optional boolean) Enable Analytics debugging mode (development use ONLY).
 *          }
 *      });
 */
 
Ext.define('Ext.ux.GoogleAnalytics', {
    singleton: true,
    alternateClassName: 'Ext.GoogleAnalytics',
    mixins: {
        observable: 'Ext.util.Observable'
    },
    requires: [
        'Ext.app.Application'
    ],
    
    // @private
    constructor: function() {
        var me = this;
        me.ready = false;
        me.configured = false;
        me.GoogleAnalytics = {};
        me.mixins.observable.constructor.call(me);
    },
    
    /**
     * Processes the config for the given app.
     * @private
     */
    init: function(app) {
        var me = this;
        
        if(!app || !app.GoogleAnalytics) {
            return;
        }
        
        me.processConfig(app);
        
        if(me.ready || !me.configured) {
            return;
        }
        me.ready = true;
        
        me.addEvents(
            /**
             * @event ga_track_event
             * Fires when an event is tracked
             * @param {String} category
             * @param {String} action
             */
            'ga_track_event',
            /**
             * @event ga_track_pageview
             * Fires when a pageview is tracked
             * @param {String} pagepath
             */
            'ga_track_pageview'
        );
        
        Ext.onReady(function() {
            // Ensure that the globally-scoped queue variable is defined
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script',me.debugMode ? '//www.google-analytics.com/analytics_debug.js' : '//www.google-analytics.com/analytics.js','ga');
            
            ga('create', me.trackingCode, 'auto');
            if(me.forceSSL) {
            	ga('set', 'forceSSL', true); // Send all data using SSL, even from insecure (HTTP) pages.
            }
            ga('send', 'pageview');
        });
    },
    
    /**
     * Validate configuration.
     * @private
     */
    processConfig: function(app) {
        var me = this,
            config = app.GoogleAnalytics;
        
        if(!config.trackingCode) {
            Ext.log.error('ga: tracking code is missing from config');
            return false;
        }
        
        me.trackingCode = config.trackingCode;
        me.forceSSL = Ext.isBoolean(config.forceSSL) && config.forceSSL ? true : '';
        me.debugMode = Ext.isBoolean(config.debugMode) && config.debugMode ? true : '';
        me.configured = true;
    },
    
    /**
     * Issues a track event to the Google Analytics server.
     *
     * @param {String} category         The name you supply for the group of objects you want to track.
     * @param {String} action           A string that is uniquely paired with each category and commonly used to define the type of user interaction for the web object.
     * @param {String} label            An optional string to provide additional dimensions to the event data.
     * @param {Number} value            An integer that you can use to provide additional dimensions to the event data.
     * @param {Boolean) noninteraction  A boolean that we set to true, indicates that the event hit will not be used in bounce-rate calculation.
     * @return {Boolean}                True if the function was successful otherwise false
     */
    trackEvent: function(category, action, label, value, noninteraction) {
        var me = this,
            opt_label = Ext.isString(label) ? label : '',
            opt_value = Ext.isNumber(value) ? value : '',
            opt_noninteraction = Ext.isBoolean(noninteraction) ? {'noninteraction': 1} : '';
        
        if(!category || !Ext.isString(category)) {
            Ext.log.error('trackEvent: category argument not defined or not a string');
            return false;
        }
        
        if(!action || !Ext.isString(action)) {
            Ext.log.error('trackEvent: action argument not defined or not a string');
            return false;
        }
        
        if(opt_label) {
            if(opt_value) {
                if(opt_noninteraction) {
                    ga('send', 'event', category, action, opt_label, opt_value, opt_noninteraction);
                } else {
                    ga('send', 'event', category, action, opt_label, opt_value);
                }
            } else {
                if(opt_noninteraction) {
                    ga('send', 'event', category, action, opt_label, opt_noninteraction);
                } else {
                    ga('send', 'event', category, action, opt_label);
                }
            }
        } else {
            if(opt_noninteraction) {
                ga('send', 'event', category, action, opt_noninteraction);
            } else {
                ga('send', 'event', category, action);
            }
        }
        
        me.fireEvent('ga_track_event', category, action);
        
        return true;
    },
    
    /**
     * Issues a track pageview to the Google Analytics server.
     *
     * @param {String} pagepath   The URL string you want to track.
     * @param {String} pagetitle  The custom page title of the page you want to track.
     * @return {Boolean}          True if the function was successful otherwise false
     */
    trackPageView: function(pagepath, pagetitle) {
        var me = this,
        opt_pagetitle = Ext.isString(pagetitle) ? pagetitle : '';
        
        if(!pagepath || !Ext.isString(pagepath)) {
            Ext.log.error('trackPageView: pagepath argument not defined or not a string');
            return false;
        }
        
        // Ensure pagepath startswith a leading '/' character
        if(!(/^\//).test(pagepath)) {
            pagepath = '/'+pagepath;
        }
        
        if(opt_pagetitle) {
            ga('send', 'pageview', {
                'page': pagepath,
                'title': opt_pagetitle
            });
        } else {
            ga('send', 'pageview', pagepath);
        }
        
        me.fireEvent('ga_track_pageview', pagepath);
        
        return true;
    }
},
function() {
    /*
     * Patch Ext.Application to auto-initialize Google Analytics tracker
     */
    Ext.override(Ext.app.Application, {
        enableGoogleAnalytics: true,
        onBeforeLaunch: function() {
            this.callOverridden();
            
            if(this.enableGoogleAnalytics) {
                Ext.ux.GoogleAnalytics.init(this);
            }
        }
    });
});
