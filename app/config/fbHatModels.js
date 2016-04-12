var hatDataSourceConfig = {
  events: {
    name: "events",
    source: "facebook",
    fields: [
      { name: "id" },
      { name: "name" },
      { name: "description" },
      { name: "start_time" },
      { name: "end_time" },
      { name: "rsvp_status" }
    ],
    subTables: [
      {
        name: "place",
        source: "facebook",
        fields: [
          { name: "id" },
          { name: "name" }
        ],
        subTables: [
          {
            name: "location",
            source: "facebook",
            fields: [
              { name: "city" },
              { name: "country" },
              { name: "latitude" },
              { name: "longitude" },
              { name: "located_in" },
              { name: "name" },
              { name: "state" },
              { name: "street" },
              { name: "zip" }
            ]
          }
        ]
      }
    ]
  },
  posts: {
    name: "posts",
    source: "facebook",
    fields: [
      { name: "id" },
      { name: "caption" },
      { name: "created_time" },
      { name: "description" },
      { name: "link" },
      { name: "message" },
      { name: "name" },
      { name: "object_id" },
      { name: "picture" },
      { name: "full_picture" },
      { name: "status_type" },
      { name: "story" },
      { name: "type" },
      { name: "updated_time" }
    ],
    subTables: [
      {
        name: "from",
        source: "facebook",
        fields: [
          { name: "name" },
          { name: "id" }
        ]
      }, {
        name: "privacy",
        source: "facebook",
        fields: [
          { name: "value" },
          { name: "description" },
          { name: "friends" },
          { name: "allow" },
          { name: "deny" }
        ]
      }, {
        name: "application",
        source: "facebook",
        fields: [
          { name: "category" },
          { name: "link" },
          { name: "name" },
          { name: "namespace" },
          { name: "id" }
        ]
      }
    ]
  },
  profile: {
    name: "profile",
    source: "facebook",
    fields: [
      { name: "id" },
      { name: "birthday" },
      { name: "email" },
      { name: "first_name" },
      { name: "gender" },
      { name: "is_verified" },
      { name: "last_name" },
      { name: "locale" },
      { name: "name" },
      { name: "political" },
      { name: "relationship_status" },
      { name: "religion" },
      { name: "quotes" },
      { name: "third_party_id" },
      { name: "timezone" },
      { name: "updated_time" },
      { name: "verified" },
      { name: "website" }
    ],
    subTables: [
      {
        name: "hometown",
        source: "facebook",
        fields: [
          { name: "id" },
          { name: "name" }
        ]
      }, {
        name: "significant_other",
        source: "facebook",
        fields: [
          { name: "id" },
          { name: "name" }
        ]
      }
    ]
  },
  profilePicture: {
    name: "profile_picture",
    source: "facebook",
    fields: [
      { name: "height" },
      { name: "width" },
      { name: "is_silhouette" },
      { name: "url" }
    ],
    subTables: []
  }
}

module.exports = hatDataSourceConfig;