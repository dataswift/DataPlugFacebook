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

  getQueryString: function(node) {
    return '&fields=' + this[node]['used'].join(',');
  }
};

module.exports = facebookQueryFields_v_2_5;