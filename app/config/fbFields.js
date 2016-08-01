var facebookQueryFields_v_2_5 = {
  posts: {
    available: ['id', 'admin_creator', 'application', 'call_to_action', 'caption',
     'created_time', 'description', 'feed_targeting', 'from', 'icon', 'is_hidden',
     'is_published', 'link', 'message', 'message_tags', 'name', 'object_id', 'picture',
     'place', 'privacy', 'properties', 'shares', 'source', 'status_type', 'story',
     'targeting', 'to', 'type', 'updated_time', 'with_tags', 'full_picture'],
    availableEdges: ['likes', 'comments', 'sharedposts', 'insights', 'attachments'],
    used: ['id', 'application', 'caption', 'created_time', 'description', 'from', 'link', 'message', 'name','object_id', 'picture', 'full_picture', 'privacy', 'status_type', 'story', 'type', 'updated_time']
  },

  profile: {
    available: ['id', 'about', 'age_range', 'bio', 'birthday', 'context', 'currency', 'devices',
    'education', 'email', 'favorite_athletes', 'favorite_teams', 'first_name', 'gender', 'hometown',
    'inspirational_people', 'install_type', 'installed', 'interested_in', 'is_shared_login',
    'is_verified', 'languages', 'last_name', 'link', 'location', 'locale', 'meeting_for',
    'middle_name', 'name', 'name_format', 'payment_pricepoints', 'test_group', 'political',
    'relationship_status', 'religion', 'security_settings', 'significant_other', 'sports', 'quotes',
    'third_party_id', 'timezone', 'token_for_business', 'updated_time',
    'shared_login_upgrade_required_by', 'verified', 'video_upload_limits', 'viewer_can_send_gift',
    'website', 'work', 'public_key', 'cover'],
    used: ['id', 'birthday', 'email', 'first_name', 'gender', 'hometown',
    'is_verified', 'last_name', 'locale', 'name', 'political', 'relationship_status',
    'religion', 'quotes', 'significant_other', 'third_party_id',
    'timezone', 'updated_time', 'verified', 'website']
  },

  events: {
    available: ['id', 'category', 'cover', 'description', 'type', 'end_time', 'is_viewer_admin',
    'is_page_owned', 'can_guests_invite', 'guest_list_enabled', 'name', 'owner', 'parent_group', 'place', 'start_time', 'ticket_uri', 'timezone', 'updated_time',
    'attending_count', 'declined_count', 'maybe_count', 'noreply_count'],
    used: ['id', 'name', 'description', 'start_time', 'end_time', 'rsvp_status', 'place']
  },

  getBaseUrl: function(graphAccessToken, lastUpdate) {
    var graphRequestUrl = 'https://graph.facebook.com/me/music.listens?access_token='+graphAccessToken;

    if (lastUpdate) {
      graphRequestUrl += '&since='+lastUpdate;
    }

    return graphRequestUrl;
  },

  getProfilePictureUrl: function(graphAccessToken) {
    var graphRequestUrl = 'https://graph.facebook.com/me/picture';
    graphRequestUrl += '?access_token='+graphAccessToken+'&height=320&width=320&redirect=false';
    return graphRequestUrl;
  },

  getRequestUrl: function(node, graphAccessToken, lastUpdate) {
    var graphRequestUrl = 'https://graph.facebook.com/me/';

    if (node === 'events' || node === 'posts') {
      graphRequestUrl += node;
    }

    graphRequestUrl += '?access_token='+graphAccessToken+'&fields='+this[node]['used'].join(',');

    if (lastUpdate) {
      graphRequestUrl += '&since='+lastUpdate;
    }

    return graphRequestUrl;
  }
};

module.exports = facebookQueryFields_v_2_5;