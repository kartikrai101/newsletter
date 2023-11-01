const { Op } = require("sequelize");
const { User } = require("../models");

// ------------------------ handler functions --------------------------
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


// ---------------------- controller functions --------------------------

exports.searchUser = async (req, res) => {
    try{
        // we need to extract the search string from the req body
        let searchString = req.body.searchString;
        let searchString2 = req.body.searchString;

        // convert the first letter of the search string to capital letter
        if(searchString.length > 0){
            searchString = capitalizeFirstLetter(searchString)
        }

        const results = await User.findAll({
            where: {
                [Op.or]: [
                    {
                        fname: {
                            [Op.like]: searchString + '%'
                        }
                    },
                    {
                        lname: {
                            [Op.like]: searchString + '%'
                        }
                    },
                    {
                        fname: {
                            [Op.like]: '%' + searchString2
                        }
                    },
                    {
                        lname: {
                            [Op.like]: '%' + searchString2
                        }
                    },
                    {
                        fname: {
                            [Op.like]: '%' + searchString2 + '%'
                        }
                    },
                    {
                        lname: {
                            [Op.like]: '%' + searchString2 + '%'
                        }
                    }
                ]
            }
        })

        res.status(201).json({
            success: true,
            message: "successfully fetched matching users!",
            results
        })
    }catch(err){
        res.status(401).json({
            success: false,
            message: "could not search the user",
            err
        })
    }
}