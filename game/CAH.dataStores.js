function initDataStores() {
    //player store
    playerStore = Ext.create('Ext.data.Store', {
        storeId:'playerStore',
        fields:['id', 'name', 'imageURL', 'points', 'displayIndex', 'participantID', 'cardsInHand'],
        data:{'items':[
        ]},
        proxy:{
            type:'memory',
            reader:{
                type:'json',
                root:'items'
            }
        }
    });
}
