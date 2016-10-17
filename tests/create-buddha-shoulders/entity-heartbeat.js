(function() { 
    return {
        t: -1,
        heartbeat: function(dt) {
            this.t += dt;
            if (this.t >= 1/20) {
                // force updates at least 20 fps (by updating an arbitrary property)
                Entities.editEntity(this.uuid, { visible: true });
                this.t = 0;
            }
        },
        live: function() {
            if (!this.heart) {
                // for an update right away to try and prevent the initial "stall"
                this.heartbeat(Infinity);
                print('... connecting pulse', this.uuid);
                Script.update.connect(this, 'heartbeat');
                this.heart = true;
            }
        },
        die: function() {
            if (this.heart) {
                print('...disconnecting pulse', this.uuid);
                Script.update.disconnect(this, 'heartbeat');
                this.heart = false;
            }
        },
        _clickDownOnEntity: function(uuid, evt) {
            print('clickDownOnEntity', uuid, !!this.heart);
            if (this.heart)
                this.die();
            else
                this.live();
        },
        unload: function(uuid) { this.die(); },
        preload: function(uuid) {
            this.uuid = uuid;
            var ent = Entities.getEntityProperties(uuid);
            var parentedProps = JSON.parse(ent.userData);
            if (parentedProps.parentID !== MyAvatar.sessionUUID)
                return print('... parentedProps.parentID !== MyAvatar.sessionUUID -- bailing.');
            print('... applying userData properties:', JSON.stringify(parentedProps));
            Entities.editEntity(uuid, parentedProps);
            this.live();
            this.clickDownOnEntity = this._clickDownOnEntity; // if we made it this far, enable onclick toggling
        }
    };
})
