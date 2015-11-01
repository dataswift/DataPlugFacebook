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
  }
}

module.exports = hatDataSourceConfig;