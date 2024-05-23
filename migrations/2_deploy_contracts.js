const Voting = artifacts.require("Voting");

module.exports = function (deployer) {
    const candidateNames = [
        "Alvaro Uribe",
        "Gustavo Petro",
        "Juan Manuel Santos",
        "Rodolfo Hernández",
        "Federico Guitiérrez",
        "Sergio Fajardo",
        "John Milton Rodríguez",
        "Humberto de la Calle"
    ];
    deployer.deploy(Voting, candidateNames);
};
