import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell, Paper } from '@mui/material';

const DataTable = ({ data }) => {

    webflow.setExtensionSize('large')
    
    return (
        <Paper>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Display Name</TableCell>
                        <TableCell>Created On</TableCell>
                        <TableCell>Last Updated</TableCell>
                        <TableCell>Last Published</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.displayName}</TableCell>
                            <TableCell>{new Date(item.createdOn).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(item.lastUpdated).toLocaleDateString()}</TableCell>
                            <TableCell>{item.lastPublished ? new Date(item.lastPublished).toLocaleDateString() : 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
};

export default DataTable;
