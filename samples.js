let barred = [
    {
        exp: "viz.com",
        allowIf: [

            {
                timeRanges: [["11:30","13:00"], ["17:00","22:00"]],
                weekDays:[1,2],
            },
            {
                monthDays:[1,15]
            }

        ]
    },
    {
        exp: "youtube.com",
        warnOnly: true,
        allowIf:[
            {
                monthDays:[1,2,5]
            }]
    },
    {
        exp: "fandom"
    },
    {
        exp: "netflix",
        allowIf: [
            {
                timeRanges: [["11:30","13:00"], ["17:00","22:00"]]
            }
        ]
    }
];