function initLayout() {

    Ext.application({
        name:'Hangouts Against Humanity',
        launch:function () {
            //main app layout
            Ext.create('Ext.container.Viewport', {
                layout: 'border',
                items: [{
                    title: 'Your Cards',
                    id: 'handArea',
                    region: 'south',     // position for region
                    xtype: 'panel',
                    height: 300,
                    split: true,         // enable resizing
                    margins: '0 5 5 5',
                    autoScroll: true
                },{
                    // xtype: 'panel' implied by default
                    title: 'Game State',
                    region:'west',
                    xtype: 'panel',
                    margins: '5 0 0 5',
                    autoScroll: true,
                    width: 200,
                    split: true,
                    collapsible: true,   // make collapsible
                    id: 'gameStatePanel',
                    layout:{
                        type:'vbox',
                        align:'stretch'
                    },
                    items: [
                        {
                            xtype:'panel',
                            id:'gameButtons',
                            bodyPadding: 5,
                            layout:{
                                type:'hbox',
                                align:'stretch'
                            },
                            items: [
                                {
                                    xtype:'button',
                                    width:'60',
                                    id: 'startGameButton',
                                    text:'Start Game',
                                    handler:function () {
                                        startGame();
                                    }
                                },
                                {
                                    id:'goalDisplay',
                                    margin: '0 0 0 5',
                                    xtype:'numberfield',
                                    fieldLabel:'Goal',
                                    labelWidth:35,
                                    width:65,
                                    value:0,
                                    readOnly: true,
                                    hidden: true
                                },
                                {
                                    id:'turnCounter',
                                    margin: '0 0 0 25',
                                    xtype:'numberfield',
                                    fieldLabel:'Turn',
                                    labelWidth:40,
                                    width:75,
                                    value:0,
                                    readOnly: true
                                },
                            ]
                        },
                        {
                            xtype:'grid',
                            id:'playerGrid',
                            margin: '10 0 0 0',
                            autoScroll: true,
                            store:Ext.data.StoreManager.lookup('playerStore'),
                            sortableColumns: false,
                            columns:[
                                {
                                    text: 'id',
                                    dataIndex: 'id',
                                    hidden: true
                                },
                                {
                                    xtype: 'templatecolumn',
                                    header: 'Player',
                                    width: 145,
                                    tpl: [
                                        '<img src="{imageURL}" width="25" height="25" style="float:left;"></img>',
                                        '<div style="float:left;margin-left: 5px;padding: 5px">{name}</div>'
                                    ]
                                },
                                { text:'Points', dataIndex:'points', width: 50, align: 'center', tdCls: 'cellPadding'}
                            ],
                            viewConfig: {markDirty:false, forceFit: true}
                        }
                    ]
                },{
                    title: 'Hangouts Against Humanity',
                    id: 'sharedArea',
                    region: 'center',     // center region is required, no width/height specified
                    xtype: 'panel',
                    layout: 'fit',
                    margins: '5 5 0 0',
                    autoScroll: true,
                    tools:[
                        /* {
                         type:'gear',
                         handler:function () {
                         //chat settings here
                         }},*/
                        {
                            type:'help',
                            handler:function () {
                                if (helpWindow.isVisible()) {
                                    helpWindow.hide();
                                }
                                else {
                                    helpWindow.show();
                                }
                            }
                        }
                    ]
                }],
                renderTo: Ext.getBody()
            });


            //right click menu for normal dice
            specialMenu = new Ext.menu.Menu({
                floating:true,
                showSeparator: false,
                cls: 'no-icon-menu',
                items: [{
                    id: 'resetGame',
                    text: 'Reset Game',
                    iconCls: 'edit'
                }
                ],
                listeners: {
                    click: function(menu,item,mouseevent) {
                        if ( item.id == "resetGame") {
                           sendEvent("resetGame");
                        }
                    }
                }
            });

            //interactive events
            Ext.select("#gameStatePanel_header").on('contextmenu', function(e) {
                if (e.shiftKey) {
                    e.preventDefault();
                    specialMenu.showAt(e.getXY());
                }
            });

            helpWindow = Ext.create('Ext.window.Window', {
                title:'Help',
                id:'helpWindow',
                height: 500,
                width: 500,
                closeAction:'hide',
                autoScroll: true,
                items:[
                    {
                        xtype: 'tabpanel',
                        id: 'chatHelpTabPanel',
                        items: [
                            {
                                title: 'Interface',
                                xtype: 'panel',
                                bodyPadding: 10,
                                styleHtmlContent: true,
                                html: 'To reset the application state hold shift+right-click on the Game State title area and click Reset Game. Note this will cause a new game to need to be started.<br><br><br>Known Bugs<ul><li>Sometimes when a new person joins you may get dealt more than 10 cards</li><li>People joining and leaving in the middle of the round can still cause strange behavior.</li><li>Floating video window can go outside of the frame.</li></ul>'
                            }
                        ]
                    }]
            });
        }
    });
}