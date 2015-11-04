var facebookQueryFields_v_2_5 = {
  post: {
    available: ['id', 'admin_creator', 'application', 'call_to_action', 'caption',
     'created_time', 'description', 'feed_targeting', 'from', 'icon', 'is_hidden',
     'is_published', 'link', 'message', 'message_tags', 'name', 'object_id', 'picture',
     'place', 'privacy', 'properties', 'shares', 'source', 'status_type', 'story',
     'targeting', 'to', 'type', 'updated_time', 'with_tags'],
    availableEdges: ['likes', 'comments', 'sharedposts', 'insights', 'attachments'],
    used: ['id', 'application', 'caption', 'created_time', 'description', 'from', 'link', 'message', 'name','object_id', 'picture', 'privacy', 'status_type', 'story', 'type', 'updated_time']
  },

  user: {
    available: ['id', 'about', 'age_range', 'bio', 'birthday', 'context', 'currency', 'devices',
    'education', 'email', 'favorite_athletes', 'favorite_teams', 'first_name', 'gender', 'hometown',
    'inspirational_people', 'install_type', 'installed', 'interested_in', 'is_shared_login',
    'is_verified', 'languages', 'last_name', 'link', 'location', 'locale', 'meeting_for',
    'middle_name', 'name', 'name_format', 'payment_pricepoints', 'test_group', 'political',
    'relationship_status', 'religion', 'security_settings', 'significant_other', 'sports', 'quotes',
    'third_party_id', 'timezone', 'token_for_business', 'updated_time',
    'shared_login_upgrade_required_by', 'verified', 'video_upload_limits', 'viewer_can_send_gift',
    'website', 'work', 'public_key', 'cover'],
    used: ['id', 'about', 'bio', 'birthday', 'email', 'first_name', 'gender', 'hometown',
    'is_verified', 'last_name', 'locale', 'middle_name', 'name', 'political', 'relationship_status',
    'religion', 'security_settings', 'significant_other', 'sports', 'quotes', 'third_party_id',
    'timezone', 'updated_time', 'verified', 'website']
  },

  getQueryString: function(node) {
    return '&fields=' + this[node]['used'].join(',');
  }
};

module.exports = facebookQueryFields_v_2_5;