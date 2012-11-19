function initLayout() {

    Ext.application({
        name:'Hangouts Against Humanity',
        launch:function () {
            //main app layout
            Ext.create('Ext.container.Viewport', {
                layout: 'border',
                items: [{
                    title: 'Your Cards',
                    region: 'south',     // position for region
                    xtype: 'panel',
                    height: 300,
                    split: true,         // enable resizing
                    margins: '0 5 5 5',
                    html: '<div class="card whitecard"><div class="cardtext">Puppies!</div></div><div class="card whitecard"><div class="cardtext">Fiery poops.</div></div><div class="card whitecard"><div class="cardtext">The Force.</div></div><div class="card whitecard"><div class="cardtext">BATMAN!!!</div></div>'
                },{
                    // xtype: 'panel' implied by default
                    title: 'Game State',
                    region:'west',
                    xtype: 'panel',
                    margins: '5 0 0 5',
                    width: 200,
                    collapsible: true,   // make collapsible
                    id: 'west-region-container',
                    layout: 'fit'
                },{
                    title: 'Shared Area',
                    region: 'center',     // center region is required, no width/height specified
                    xtype: 'panel',
                    layout: 'fit',
                    margins: '5 5 0 0',
                    html: '<div class="card blackcard"><div class="cardtext">Why do I hurt all over?</div></div>'
                }],
                renderTo: Ext.getBody()
            });
        }
    });
}