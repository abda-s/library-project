module.exports = (sequelize, DataTypes) => {
    const books = sequelize.define("books", {
      tagId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      author: {  // Fixed typo from 'auther'
        type: DataTypes.STRING,
        allowNull: true
      },
      checkedIn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    }, {
      timestamps: true,
    });
  
    return books;
  };